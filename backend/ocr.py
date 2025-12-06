from __future__ import annotations

import io
from typing import Final

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image


SUPPORTED_IMAGE_FORMATS: Final[set[str]] = {
    "JPEG",
    "PNG",
    "WEBP",
    "TIFF",
}

OCR_LANG: Final[str] = "pol"


def _is_pdf(data: bytes) -> bool:
    # Check PDF magic header
    return data.lstrip().startswith(b"%PDF")


def _extract_text_from_pdf(data: bytes) -> str:
    """
    Run OCR on a PDF document by converting pages to images first.

    Requires `pdf2image` and a Poppler installation available on the system.
    """
    try:
        pages = convert_from_bytes(data)
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Unable to convert PDF to images") from exc

    texts: list[str] = []
    for page in pages:
        page_text = pytesseract.image_to_string(page, lang=OCR_LANG)
        texts.append(page_text.strip())
    return "\n\n".join(t for t in texts if t)


def extract_text_from_image(data: bytes) -> str:
    """
    Run OCR on bytes and return extracted text.

    Supports:
    - raster images (PNG/JPEG/WEBP/TIFF),
    - PDF files (each page converted to an image).
    """
    if not data:
        return ""

    if _is_pdf(data):
        return _extract_text_from_pdf(data)

    try:
        image = Image.open(io.BytesIO(data))
    except Exception as exc:  # pragma: no cover - defensive
        raise ValueError("Unable to open document as an image") from exc

    if image.format and image.format.upper() not in SUPPORTED_IMAGE_FORMATS:
        raise ValueError(f"Unsupported image format: {image.format}")

    text = pytesseract.image_to_string(image, lang=OCR_LANG)
    return text.strip()
