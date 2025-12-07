from __future__ import annotations

import io
import os
from typing import Final, List, Optional

import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate


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


def extract_texts_from_pdfs(pdf_files: List[bytes]) -> List[str]:
    """
    Przyjmij wiele plików PDF (bytes) i zwróć listę tekstów po OCR.
    """
    texts: List[str] = []
    for data in pdf_files:
        if not data:
            continue
        if not _is_pdf(data):
            raise ValueError("Non‑PDF data passed to extract_texts_from_pdfs")
        texts.append(_extract_text_from_pdf(data))
    return texts


# Prompty i definicje używane do streszczania kart wypadku (fakty).
DEFINICJA_WYPADKU: Final[str] = """Wypadek przy pracy osób prowadzących pozarolniczą działalność gospodarczą – definicje.
Wypadek przy pracy jest zdarzeniem nagłym, spowodowanym przez przyczynę zewnętrzną, która
doprowadziła do urazu lub śmierci, które nastąpiło w okresie ubezpieczenia wypadkowego, np.
z tytułu prowadzenia działalności pozarolniczej i podczas wykonywania zwykłych czynności z nią
związanych.
Abyśmy mogli uznać zdarzenie za wypadek przy pracy muszą wystąpić wszystkie powyżej
wymienione elementy.
Przez nagłość zdarzenia rozumiemy natychmiastowe ujawnienie się przyczyny zewnętrznej, która
wywołała określone skutki, lub działanie tej przyczyny przez pewien okres, ale nie dłużej niż przez
jedną dniówkę roboczą.
O przyczynie zewnętrznej możemy mówić jeśli do urazu doszło w wyniku oddziaływania na
człowieka czynnika występującego poza jego organizmem.
"""


SYSTEM_PROMPT_FAKTY: Final[str] = """Jesteś ekspertem BHP i prawnikiem prawa ubezpieczeń społecznych.
Na podstawie przekazanych dokumentów opisujących wypadek przy pracy przygotuj zwięzłe,
zsyntetyzowane podsumowanie faktów istotnych dla oceny, czy zdarzenie spełnia definicję wypadku
przy pracy. Skup się tylko na faktach istotnych prawnie.

Uwzględniaj definicję wypadku przy pracy (treść zostanie dołączona poniżej).

Wynik zwróć w uporządkowanym formacie tekstowym z nagłówkami:
- OKOLICZNOŚCI ZDARZENIA
- NAGŁOŚĆ ZDARZENIA (czy zdarzenie jest nagłe)
- PRZYCZYNA ZEWNĘTRZNA (jakie czynniki zewnętrzne)
- ZWIĄZEK Z WYKONYWANIEM PRACY / DZIAŁALNOŚCI
- URAZ / SKUTEK ZDROWOTNY
- DODATKOWE ISTOTNE OKOLICZNOŚCI
- WERDYKT (czy zdarzenie spełnia definicję wypadku przy pracy, z krótkim, rzeczowym uzasadnieniem)
"""


def _get_llm() -> Optional[ChatGoogleGenerativeAI]:
    """
    Prosty factory na LLM-a używanego do streszczania faktów.
    """
    load_dotenv()
    try:
        return ChatGoogleGenerativeAI(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            temperature=0,
        )
    except Exception:
        # Jeśli nie uda się zainicjalizować LLM-a, zwracamy None;
        # wywołujący może użyć fallbacku.
        return None


def summarize_accident_facts_from_pdfs(pdf_files: List[bytes]) -> str:
    """
    Przyjmij wiele plików PDF (kart wypadku), wykonaj OCR, a następnie
    przygotuj podsumowanie faktów zgodnie z SYSTEM_PROMPT_FAKTY
    i DEFINICJA_WYPADKU.

    Zwraca uporządkowany tekst (nagłówki + streszczenie faktów).
    """
    texts = extract_texts_from_pdfs(pdf_files)
    joined_text = "\n\n---\n\n".join(t for t in texts if t.strip())
    if not joined_text:
        return ""

    llm = _get_llm()
    if llm is None:
        # Fallback: zwracamy sam tekst połączony bez przetwarzania LLM.
        return joined_text

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                SYSTEM_PROMPT_FAKTY
                + "\n\nDefinicja wypadku przy pracy:\n{definition}",
            ),
            (
                "human",
                "Teksty kart wypadku (po OCR):\n{facts_docs}\n\n"
                "Przygotuj podsumowanie faktów w wymaganym formacie.",
            ),
        ]
    )

    chain = prompt | llm | StrOutputParser()
    return chain.invoke(
        {
            "definition": DEFINICJA_WYPADKU,
            "facts_docs": joined_text,
        }
    )


def build_filled_card_text_from_summary(summary_text: str) -> str:
    """
    Wczytuje fragmenty wzoru karty z plików tekstowych w katalogu głównym
    (poczatek.txt, pytanie1.txt, srodek.txt, pytanie2.txt, pytanie3.txt,
    pytanie4.txt, koniec.txt), przekazuje je wraz ze streszczeniem faktów
    do LLM i prosi o uzupełnienie TYLKO kropek tam, gdzie odpowiedź
    jednoznacznie wynika z summary.

    Zwraca jeden sklejony tekst:
    poczatek + pytanie1 + srodek + pytanie2 + pytanie3 + pytanie4 + koniec
    po uzupełnieniu.
    """
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    parts = []
    filenames = [
        "poczatek.txt",
        "pytanie1.txt",
        "srodek.txt",
        "pytanie2.txt",
        "pytanie3.txt",
        "pytanie4.txt",
        "koniec.txt",
    ]

    for name in filenames:
        path = os.path.join(project_root, name)
        try:
            with open(path, "r", encoding="utf-8") as f:
                parts.append(f.read())
        except Exception:
            # Jeśli któregoś pliku brakuje, traktujemy go jak pusty fragment.
            parts.append("")

    template_text = "\n".join(parts)

    llm = _get_llm()
    if llm is None or not summary_text.strip():
        # Bez LLM – zwracamy sam szablon, nic nie zmieniamy.
        return template_text

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Masz zestaw fragmentów tekstowego wzoru karty wypadku, "
                    "sklejony w jeden ciąg, oraz streszczenie faktów wypadku.\n"
                    "Twoje zadanie:\n"
                    "- uzupełnij TYLKO te miejsca z kropkami (ciągi typu '.....'), "
                    "dla których odpowiedź jednoznacznie wynika ze streszczenia faktów,\n"
                    "- ZACHOWAJ treść pytań i reszty tekstu bez zmian (nie usuwaj nagłówków, numeracji, objaśnień),\n"
                    "- tam, gdzie nie da się nic dopowiedzieć na podstawie streszczenia, "
                    "pozostaw kropki dokładnie tak jak są,\n"
                    "- odpowiedz WYŁĄCZNIE gotowym tekstem karty po uzupełnieniu, bez komentarzy ani metadanych."
                ),
            ),
            (
                "human",
                (
                    "Streszczenie faktów wypadku:\n{summary}\n\n"
                    "Sklejony tekst z plików (poczatek/pytania/srodek/koniec):\n{template}\n\n"
                    "Zwróć kompletny tekst po uzupełnieniu możliwych pól."
                ),
            ),
        ]
    )

    chain = prompt | llm | StrOutputParser()
    try:
        filled_text = chain.invoke(
            {
                "summary": summary_text,
                "template": template_text,
            }
        )
    except Exception:
        # W razie problemów z LLM – oddaj niezmieniony szablon.
        return template_text

    return filled_text
