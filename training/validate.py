"""Sanity-check model.onnx against the real CAPTCHA samples.

    python validate.py

Reads ../real_samples/labels.csv (filename,code) and prints predicted vs true.
With only a couple of real samples this is a qualitative check that the
synthetic font/noise matches reality — not a statistical accuracy figure.
"""
import csv
import os

import numpy as np
import onnxruntime as ort
from PIL import Image

from config import NUM_CHARS, IMG_W, IMG_H, decode
from generate_synthetic import crop_to_content

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES_DIR = os.path.join(HERE, "..", "real_samples")
MODEL = os.path.join(HERE, "model.onnx")


def preprocess(path):
    img = Image.open(path).convert("RGB")
    img = crop_to_content(img)                        # same normalization as training
    img = img.resize((IMG_W, IMG_H), Image.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0   # H,W,3
    arr = np.transpose(arr, (2, 0, 1))[None, ...]     # 1,3,H,W
    return arr


def main():
    labels_csv = os.path.join(SAMPLES_DIR, "labels.csv")
    if not os.path.exists(labels_csv):
        print(f"No {labels_csv}. Drop real captchas in real_samples/ with a "
              f"labels.csv (filename,code) to validate.")
        return

    sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    in_name = sess.get_inputs()[0].name

    total = correct = char_correct = char_total = 0
    with open(labels_csv) as f:
        for row in csv.DictReader(f):
            fname, true = row["filename"], row["code"].strip().upper()
            path = os.path.join(SAMPLES_DIR, fname)
            if not os.path.exists(path):
                print(f"  (missing {fname})")
                continue
            logits = sess.run(None, {in_name: preprocess(path)})[0]  # [1,NUM_CHARS,NUM_CLASSES]
            pred = decode(logits[0].argmax(axis=1))
            ok = pred == true
            total += 1
            correct += ok
            for a, b in zip(pred, true):
                char_correct += (a == b)
            char_total += len(true)
            print(f"  {fname:28s} true={true}  pred={pred}  {'OK' if ok else 'X'}")

    if total:
        print(f"\nstring acc {correct}/{total}   char acc {char_correct}/{char_total}")


if __name__ == "__main__":
    main()
