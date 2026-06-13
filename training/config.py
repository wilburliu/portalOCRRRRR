"""Shared configuration for the NTUH CAPTCHA OCR model.

Keep these in sync with the browser-side decoder in App.tsx
(CHARSET, NUM_CHARS, IMG_W, IMG_H must match exactly).
"""

# Character set the CAPTCHA can contain. The model has NUM_CHARS heads,
# each a softmax over len(CHARSET) classes.
# NOTE: confirm against real samples in real_samples/. If the real CAPTCHA
# excludes confusable glyphs (e.g. O/0, I/1), prune them here and regenerate.
CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
NUM_CHARS = 6

# Network input size (H x W). The browser resizes the captcha <img> to this.
IMG_H = 64
IMG_W = 192

NUM_CLASSES = len(CHARSET)

# index <-> char helpers
CHAR_TO_IDX = {c: i for i, c in enumerate(CHARSET)}
IDX_TO_CHAR = {i: c for i, c in enumerate(CHARSET)}


def encode(code: str):
    """'9661N5' -> [9, 6, 6, 1, 23, 5]"""
    assert len(code) == NUM_CHARS, f"expected {NUM_CHARS} chars, got {code!r}"
    return [CHAR_TO_IDX[c] for c in code]


def decode(indices) -> str:
    """[9, 6, 6, 1, 23, 5] -> '9661N5'"""
    return "".join(IDX_TO_CHAR[int(i)] for i in indices)
