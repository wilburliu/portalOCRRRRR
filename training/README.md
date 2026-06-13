# CAPTCHA model training

A small CNN that reads the NTUH portal CAPTCHA (6 chars, `[0-9A-Z]`, fixed font,
colored-line noise). It replaces Tesseract in the bookmarklet and runs
client-side via onnxruntime-web.

## Why a custom model

The CAPTCHA is a *fixed format*. A model trained on look-alike images learns
this one font + noise style and reads it far more reliably (typically 95%+ on
synthetic) than a general OCR engine, which plateaus around 50–70% on noisy
fixed CAPTCHAs. Color is a feature here: the net learns to ignore the colored
noise lines, so there's no fragile binarization/threshold step.

## Pipeline

```
1. generate_synthetic.py   # render thousands of look-alike CAPTCHAs
2. train.py                # train 6-head CNN, export model.onnx
3. validate.py             # sanity-check against real_samples/
```

### Setup

```bash
pip install -r requirements.txt   # numpy is pinned <2 for torch 2.2.x
```

The whole `training/` folder is cross-platform — copy it to a faster machine
(e.g. a Windows desktop with an NVIDIA GPU) and run it there. Fonts are
auto-resolved by filename across Windows/macOS/Linux, so no path edits needed.

#### Windows + NVIDIA GPU (recommended for speed)

`pip install -r requirements.txt` gives a **CPU-only** torch on Windows. For GPU,
install the CUDA build first, then the rest:

```powershell
# match the CUDA tag to your driver: cu121 / cu124 (see pytorch.org/get-started)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install pillow "numpy<2" onnx onnxruntime
```

Verify the GPU is visible:

```powershell
python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

`train.py` auto-selects `cuda` when available (falls back to `mps`/`cpu`). With a
GPU, 20 epochs over 20k images takes well under a minute.

Notes:
- On Windows the `DataLoader` workers re-import this module; that's why the heavy
  code lives under `if __name__ == "__main__":`. If you ever see worker spawn
  errors, set `num_workers=0` in `train.py`.
- The font resolver searches `C:\Windows\Fonts` (and your user fonts dir). If a
  font isn't found, drop a `.ttf` beside the script and add its name to
  `FONT_SPECS` in `generate_synthetic.py`.

### 1. Generate data

```bash
python generate_synthetic.py --train 20000 --val 2000
```

Writes `dataset/{train,val}/` + `preview.png`. **Open `preview.png` and compare
it to your real captchas** — the synthetic font/noise must look like the real
thing or real accuracy suffers. Tune the `Style parameters` block at the top of
`generate_synthetic.py` (font, glyph size, rotation, noise color/thickness/count)
and regenerate until it matches.

### 2. Train + export

```bash
python train.py --epochs 20
```

Prints val char-/string-accuracy each epoch and writes `model.onnx` here and at
the repo root (~6 MB). Uses CUDA/MPS if available, else CPU.

### 3. Validate against real samples

```bash
python validate.py
```

Reads `../real_samples/labels.csv` and prints predicted vs. true. With only a
couple of real samples this is a qualitative check, not an accuracy figure — if
it misses, fix the generator fidelity (step 1) and retrain.

## Deploying the model to the bookmarklet

The bookmarklet fetches the model from jsDelivr:

```
https://cdn.jsdelivr.net/gh/wilburliu/portalOCRRRRR@main/model.onnx
```

So after retraining you must **commit and push `model.onnx`** for the bookmarklet
to pick it up. jsDelivr caches aggressively — for an immediate update either
purge (`https://purge.jsdelivr.net/gh/wilburliu/portalOCRRRRR@main/model.onnx`)
or bump a git tag and use `@<tag>` in `MODEL_URL` (App.tsx).

## Config

`config.py` holds `CHARSET`, `NUM_CHARS`, `IMG_W`, `IMG_H`. These **must match**
the constants at the top of `getBookmarkletCode()` in `App.tsx`. If you change
the charset (e.g. the real CAPTCHA excludes `O`/`0`), update both, regenerate,
and retrain.
