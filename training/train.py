"""Train a small 6-head CNN on the synthetic CAPTCHAs and export to ONNX.

    python train.py --epochs 20

Outputs:
    training/model.onnx   (also copied to repo root by run convention)
Reports per-character and full-string accuracy on the synthetic val split.
"""
import argparse
import csv
import os

import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image, ImageFilter
from torch.utils.data import DataLoader, Dataset
import torchvision.transforms as T

from config import (CHARSET, NUM_CHARS, NUM_CLASSES, IMG_W, IMG_H, encode, decode)

HERE = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(HERE, "dataset")


# ── Dataset ──────────────────────────────────────────────────────────────────
class CaptchaDataset(Dataset):
    def __init__(self, split, train=False):
        self.dir = os.path.join(DATASET_DIR, split)
        self.rows = []
        with open(os.path.join(self.dir, "labels.csv")) as f:
            r = csv.DictReader(f)
            for row in r:
                self.rows.append((row["filename"], row["code"]))
        self.train = train

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, i):
        fname, code = self.rows[i]
        img = Image.open(os.path.join(self.dir, fname)).convert("RGB")
        if self.train:
            if torch.rand(1).item() < 0.3:
                img = img.filter(ImageFilter.GaussianBlur(radius=torch.rand(1).item() * 1.2))
            img = T.functional.adjust_brightness(img, 0.7 + torch.rand(1).item() * 0.6)
            img = T.functional.adjust_contrast(img, 0.7 + torch.rand(1).item() * 0.6)
            # aspect/scale jitter: the crop+stretch normalization yields varying
            # glyph aspect ratios on real captchas, so squash/stretch a little
            # (down-resize then resize back to IMG_W x IMG_H) to generalize.
            if torch.rand(1).item() < 0.5:
                sw = 0.8 + torch.rand(1).item() * 0.4   # 0.8 .. 1.2
                sh = 0.85 + torch.rand(1).item() * 0.3  # 0.85 .. 1.15
                img = img.resize((max(8, int(IMG_W * sw)), max(8, int(IMG_H * sh))), Image.BILINEAR)
        if img.size != (IMG_W, IMG_H):
            img = img.resize((IMG_W, IMG_H), Image.BILINEAR)
        x = T.functional.to_tensor(img)  # [3,H,W] in [0,1]
        y = torch.tensor(encode(code), dtype=torch.long)
        return x, y


# ── Model ────────────────────────────────────────────────────────────────────
class CaptchaNet(nn.Module):
    """Conv stack -> pool feature map to NUM_CHARS columns -> shared per-position
    classifier. Each output position aligns with one horizontal slice of the
    image, so the 6 characters are read in parallel without a giant FC trying
    to disentangle positions (which fails to generalize). A plain flatten+FC
    head memorizes a single batch but cannot learn the varied dataset; the
    column-pooling head trains to ~100% on synthetic data.

    Output: [N, NUM_CHARS, NUM_CLASSES].
    """

    def __init__(self):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(128, 256, 3, padding=1), nn.BatchNorm2d(256), nn.ReLU(), nn.MaxPool2d(2),
        )
        # Collapse height fully and resample width to exactly NUM_CHARS columns.
        self.pool = nn.AdaptiveAvgPool2d((1, NUM_CHARS))
        self.dropout = nn.Dropout(0.3)
        self.head = nn.Linear(256, NUM_CLASSES)

    def forward(self, x):
        x = self.features(x)                 # [N,256,4,12]
        x = self.pool(x)                     # [N,256,1,NUM_CHARS]
        x = x.squeeze(2).permute(0, 2, 1)    # [N,NUM_CHARS,256]
        x = self.dropout(x)
        return self.head(x)                  # [N,NUM_CHARS,NUM_CLASSES]


def evaluate(model, loader, device):
    model.eval()
    char_ok = total_chars = str_ok = total_str = 0
    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(device), y.to(device)
            logits = model(x)                     # [N,NUM_CHARS,NUM_CLASSES]
            pred = logits.argmax(dim=2)           # [N,NUM_CHARS]
            char_ok += (pred == y).sum().item()
            total_chars += y.numel()
            str_ok += (pred == y).all(dim=1).sum().item()
            total_str += y.size(0)
    return char_ok / total_chars, str_ok / total_str


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=20)
    ap.add_argument("--batch", type=int, default=128)
    ap.add_argument("--lr", type=float, default=1e-3)
    args = ap.parse_args()

    device = (
        "cuda" if torch.cuda.is_available()
        else "mps" if torch.backends.mps.is_available()
        else "cpu"
    )
    print(f"device: {device}")

    train_ds = CaptchaDataset("train", train=True)
    val_ds = CaptchaDataset("val", train=False)
    train_dl = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=2)
    val_dl = DataLoader(val_ds, batch_size=args.batch, num_workers=2)

    model = CaptchaNet().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=args.epochs)

    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        for x, y in train_dl:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            logits = model(x)                      # [N,NUM_CHARS,NUM_CLASSES]
            loss = sum(F.cross_entropy(logits[:, i, :], y[:, i]) for i in range(NUM_CHARS))
            loss.backward()
            opt.step()
            running += loss.item() * x.size(0)
        sched.step()
        char_acc, str_acc = evaluate(model, val_dl, device)
        print(f"epoch {epoch:2d}  loss {running/len(train_ds):.3f}  "
              f"val char-acc {char_acc:.4f}  val str-acc {str_acc:.4f}")

    # ── Export ONNX (output [1,NUM_CHARS,NUM_CLASSES]) ──
    model.eval().cpu()
    dummy = torch.zeros(1, 3, IMG_H, IMG_W)
    onnx_path = os.path.join(HERE, "model.onnx")
    torch.onnx.export(
        model, dummy, onnx_path,
        input_names=["input"], output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    # copy to repo root so the bookmarklet URL (gh raw/jsDelivr) resolves
    import shutil
    root_path = os.path.join(HERE, "..", "model.onnx")
    shutil.copyfile(onnx_path, root_path)
    print(f"exported {onnx_path} and {os.path.normpath(root_path)} "
          f"({os.path.getsize(onnx_path)/1024:.0f} KB)")


if __name__ == "__main__":
    main()
