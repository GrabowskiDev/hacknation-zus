# ZANT – ZUS Accident Notification Tool

System wspierający zgłoszenia wypadków przy pracy oraz podejmowanie decyzji przez ZUS w sprawie uznania zdarzeń za wypadki przy pracy osób prowadzących pozarolniczą działalność gospodarczą.  
Projekt przygotowany na HackNation 2025 na podstawie materiału „ZANT – System wspierania zgłoszeń i decyzji ZUS…”.

## Cel projektu

Osoba prowadząca działalność, która uległa wypadkowi, musi:
- zgłosić zdarzenie do ZUS,
- dostarczyć wiele informacji i dokumentów,
- a po stronie ZUS ktoś musi to wszystko przeanalizować i sporządzić kartę wypadku oraz opinię, czy zdarzenie spełnia definicję wypadku przy pracy.

ZANT ma:
- poprowadzić poszkodowanego „za rękę” przez zgłoszenie i zapis wyjaśnień,
- wskazać brakujące dane i dokumenty,
- pomóc pracownikowi ZUS w analizie dokumentów oraz przygotowaniu opinii i projektu karty wypadku.

## Najważniejsze funkcje

**Etap I – dla poszkodowanego**
- Interaktywny asystent pytający o:
  - dane poszkodowanego i działalności (PESEL, adresy, NIP/REGON, PKD),
  - okoliczności zdarzenia (data, godzina, miejsce, przebieg wypadku, uraz, pierwsza pomoc, świadkowie),
  - informacje o maszynach, środkach ochrony, BHP, szkoleniach itp.
- Dynamiczne dopasowywanie pytań do odpowiedzi użytkownika.
- Lista brakujących elementów:
  - pola wymagające doprecyzowania,
  - dokumenty, które powinny zostać dołączone do zawiadomienia.
- Automatyczne pobieranie zakresu działalności po NIP/REGON (PKD) z wbudowanych danych.
- Generowanie dokumentów:
  - **zawiadomienia o wypadku** (DOCX + PDF draft),
  - **zapisu wyjaśnień poszkodowanego** (DOCX + PDF draft),
  - paczki dokumentów w ZIP.

**Etap II – dla pracownika ZUS**
- Wczytywanie treści wielu dokumentów sprawy (zawiadomienie, wyjaśnienia, opinie, dokumentacja medyczna itd.).
- Analiza faktów pod kątem definicji wypadku przy pracy:
  - nagłość zdarzenia,
  - przyczyna zewnętrzna,
  - uraz,
  - związek z wykonywaniem zwykłych czynności w ramach działalności.
- Wykrywanie rozbieżności w dokumentach (np. różne daty/miejsca, niespójne dane świadków).
- Wskazywanie brakujących informacji i dokumentów oraz sugestie, co należy jeszcze pozyskać.
- Przygotowanie projektu **opinii prawnej** w sprawie kwalifikacji wypadku.
- Generowanie roboczego projektu **karty wypadku**:
  - na podstawie streszczenia faktów (OCR + LLM),
  - w formacie tekstowym / PDF.

## Architektura

- `backend/` – API w **FastAPI**:
  - OCR (Tesseract + pdf2image) dla skanów i PDF-ów,
  - integracja z modelem językowym (Gemini przez LangChain),
  - logika oceny sprawy (CaseState, dokumenty, rozbieżności, opinia),
  - generowanie dokumentów (DOCX, PDF, wypełniony formularz EWYP),
  - endpoint do OCR kart wypadku i budowy draftu karty na bazie szablonu `karta_wypadku.md`.
- `ZUS Accident Notification Tool/` – frontend w **React + TypeScript + Vite**:
  - interfejs konwersacyjny (asystent),
  - formularze do danych poszkodowanego, działalności, opisu zdarzenia,
  - możliwość pobrania wygenerowanych dokumentów.
- `docker-compose.yml` – uruchomienie całości (backend + frontend) jednym poleceniem.

## Uruchomienie (dev)

Wymagania:
- Python 3.12+,
- Node.js + npm,
- Tesseract i Poppler (do OCR PDF).

Backend (w katalogu `backend/`):
- skonfiguruj `.env` (na podstawie `.env.example`, w tym klucz do Google Gemini),
- zainstaluj zależności (np. `uv sync` albo `pip install -r` według Twojego workflow),
- uruchom: `uvicorn main:app --reload --port 8000`.

Frontend (w katalogu `ZUS Accident Notification Tool/`):
- `npm install`,
- `npm run dev` (domyślnie `http://localhost:5173`, backend pod `http://localhost:8000`).

Całość w Dockerze (z katalogu głównego):
- `docker-compose up --build`,
- frontend dostępny na `http://localhost:3000`, backend na `http://localhost:8000`.

## Status i dalszy rozwój

Projekt jest prototypem z hackathonu – pokazuje, jak można:
- odciążyć poszkodowanych przy zgłaszaniu wypadków,
- wesprzeć pracowników ZUS w analizie dokumentów i przygotowaniu decyzji.

Kolejne kroki mogą obejmować:
- dopracowanie promptów i reguł walidacji danych,
- integrację z rzeczywistymi systemami ZUS / PUE,
- rozbudowę panelu dla pracowników (workflow, wersjonowanie opinii, audyt).
