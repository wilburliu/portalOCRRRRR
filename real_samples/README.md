# Real CAPTCHA samples

Drop real CAPTCHA screenshots from the NTUH portal here and list them in
`labels.csv` so `training/validate.py` can sanity-check the model against
reality.

## Format

`labels.csv`:

```csv
filename,code
sample01.png,9661N5
sample02.png,A23K8Q
```

Each `filename` is a PNG/JPG of a single CAPTCHA image (crop tightly to the
captcha, no surrounding page chrome). `code` is the correct 6-character answer
in UPPERCASE.

## Why this matters

The model trains on **synthetic** captchas. These real samples don't train it —
they tell us whether the synthetic font + colored-line noise actually match the
real portal. If predictions miss here, the fix is almost always to tune
`training/generate_synthetic.py` (font, glyph size, noise color/thickness) to
look more like these images, then retrain.

The more real samples you collect over time (even 30–50), the more trustworthy
this check becomes. Two samples only catch gross mismatches.
