from __future__ import annotations

import io
from typing import Final

import pytesseract
from PIL import Image


SUPPORTED_IMAGE_FORMATS: Final[set[str]] = {
    "JPEG",
    "PNG",
    "WEBP",
    "TIFF",
}


def extract_text_from_image(data: bytes) -> str:
    """
    Run OCR on image bytes and return extracted text.

    This helper expects `data` to contain a single raster image (e.g. PNG/JPEG).
    It uses Tesseract via `pytesseract`, so Tesseract must be installed and
    available on the system PATH for this to work in runtime.
    """
    if not data:
        return ""

    try:
        image = Image.open(io.BytesIO(data))
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Unable to open document as an image") from exc

    if image.format and image.format.upper() not in SUPPORTED_IMAGE_FORMATS:
        raise ValueError(f"Unsupported image format: {image.format}")

    # Let pytesseract decide language configuration based on system setup.
    text = pytesseract.image_to_string(image)
    return text.strip()

