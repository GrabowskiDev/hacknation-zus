from __future__ import annotations

import os
from enum import Enum
from typing import Any, List, Optional
from datetime import date
from unittest import result
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser, StrOutputParser
from langchain_core.prompts import ChatPromptTemplate

from ocr import extract_text_from_image


load_dotenv()  # load GOOGLE_API_KEY and friends from .env


class Mode(str, Enum):
    NOTIFICATION = "notification"
    EXPLANATION = "explanation"


class Witness(BaseModel):
    first_name: str = Field(..., description="Imię świadka")
    last_name: str = Field(..., description="Nazwisko świadka")
    address: Optional[str] = Field(None, description="Adres świadka")

class ReporterType(str, Enum):
    VICTIM = "victim"
    PROXY = "proxy"

class CaseState(BaseModel):
    reporter_type: Optional[ReporterType] = None # Kto zgłasza?
    proxy_document_attached: bool = False

    # Dane poszkodowanego
    pesel: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    address_home: Optional[str] = None
    address_correspondence: Optional[str] = None

    # Dane działalności
    nip: Optional[str] = None
    regon: Optional[str] = None
    business_address: Optional[str] = None
    pkd: Optional[str] = None
    business_description: Optional[str] = None

    # Informacje o wypadku
    accident_date: Optional[str] = None
    accident_time: Optional[str] = None
    accident_place: Optional[str] = None
    planned_work_start: Optional[str] = None
    planned_work_end: Optional[str] = None
    injury_type: Optional[str] = None
    accident_description: Optional[str] = None
    first_aid_info: Optional[str] = None
    proceedings_info: Optional[str] = None
    equipment_info: Optional[str] = None

    # Świadkowie
    witnesses: List[Witness] = Field(default_factory=list)

    # Flagi definicyjne
    sudden: Optional[bool] = None
    external_cause: Optional[bool] = None
    injury_confirmed: Optional[bool] = None
    work_related: Optional[bool] = None


class MissingField(BaseModel):
    field: str
    reason: str


class ChatTurn(BaseModel):
    role: str  # "user" lub "assistant"
    content: str


class AssistantMessageRequest(BaseModel):
    case_id: str
    message: str
    mode: Mode
    conversation_history: List[ChatTurn] = Field(
        default_factory=list,
        description="Dotychczasowa historia rozmowy dla tej sprawy",
    )
    case_state: Optional[CaseState] = Field(
        default=None,
        description="Aktualny stan sprawy utrzymywany po stronie frontendu (opcjonalny)",
    )


class AssistantMessageResponse(BaseModel):
    assistant_reply: str
    missing_fields: List[MissingField]
    case_state_preview: CaseState


class CaseDocument(BaseModel):
    """
    Pojedynczy dokument wejściowy do oceny sprawy (np. zawiadomienie, wyjaśnienia, karta informacyjna).
    """

    name: str = Field(..., description="Nazwa/tytuł dokumentu, np. 'zawiadomienie ZUS Z-3'")
    type: Optional[str] = Field(
        default=None,
        description="Rodzaj dokumentu, np. 'zawiadomienie', 'wyjaśnienia', 'dokumentacja medyczna'",
    )
    text: str = Field(..., description="Pełna treść dokumentu po odczytaniu (np. z OCR)")


class Discrepancy(BaseModel):
    """
    Rozbieżność pomiędzy dokumentami lub pomiędzy dokumentem a ustalonym stanem faktycznym.
    """

    description: str = Field(
        ...,
        description=(
            "Opis rozbieżności (np. różne daty wypadku, różne miejsce wypadku, niespójne dane świadka)"
        ),
    )
    fields_affected: List[str] = Field(
        default_factory=list,
        description="Nazwy pól, których dotyczy rozbieżność (np. 'accident_date', 'accident_place')",
    )
    documents_involved: List[str] = Field(
        default_factory=list,
        description="Nazwy dokumentów, w których występuje rozbieżność",
    )


class OpinionOutcome(str, Enum):
    """
    Wynik oceny zdarzenia.
    """

    ACCIDENT_CONFIRMED = "accident_confirmed"
    ACCIDENT_NOT_CONFIRMED = "accident_not_confirmed"
    INCONCLUSIVE = "inconclusive"


class CaseEvaluationResult(BaseModel):
    """
    Wynik złożonej oceny sprawy na podstawie całego zestawu dokumentów.
    """

    normalized_case_state: CaseState = Field(
        ...,
        description=(
            "Ujednolicony stan faktyczny sprawy wynikający z całości dokumentów (odpowiada polom CaseState)"
        ),
    )
    discrepancies: List[Discrepancy] = Field(
        default_factory=list,
        description="Lista rozbieżności wykrytych w dokumentach",
    )
    missing_fields: List[MissingField] = Field(
        default_factory=list,
        description="Pola, które nadal wymagają uzupełnienia (np. brakujące informacje w dokumentacji)",
    )
    missing_documents: List[str] = Field(
        default_factory=list,
        description="Informacje o dokumentach, które należy jeszcze uzupełnić/dostarczyć",
    )
    opinion: OpinionOutcome = Field(
        ...,
        description=(
            "Czy zdarzenie należy uznać za wypadek podczas prowadzenia pozarolniczej działalności gospodarczej"
        ),
    )
    opinion_explanation: str = Field(
        ...,
        description="Szczegółowe, logiczne uzasadnienie przyjętego rozstrzygnięcia",
    )
    accident_card_draft: str = Field(
        ...,
        description=(
            "Projekt karty wypadku w formie tekstowej (może być w formacie zbliżonym do formularza ZUS)"
        ),
    )


class CaseEvaluationRequest(BaseModel):
    case_id: str = Field(..., description="Identyfikator sprawy (dowolny identyfikator z frontendu)")
    documents: List[CaseDocument] = Field(
        default_factory=list,
        description="Komplet dokumentów tekstowych (np. zawiadomienia, wyjaśnienia, dokumentacja medyczna)",
    )


class CaseEvaluationResponse(BaseModel):
    case_id: str
    evaluation: CaseEvaluationResult


app = FastAPI(title="ZANT Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # na potrzeby hackathonu puszczamy wszystko
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> dict:
    return {"status": "ok", "service": "ZANT backend"}


def get_llm() -> Optional[Any]:
    """
    Prosty factory na LLM-a.
    Jeśli LangChain/Gemini nie są zainstalowane, zwracamy None,
    a pipeline zadziała w trybie fallback (bez LLM).
    """
    # Możesz sterować modelem przez ENV: GEMINI_MODEL=gemini-1.5-flash
    return ChatGoogleGenerativeAI(
        model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
        temperature=0,
    )


def simple_missing_fields(
    case_state: CaseState,
    mode: Mode,
    skipped_fields: Optional[List[str]] = None,
) -> List[MissingField]:
    """
    Bardzo prosty checker braków.
    Docelowo tu możesz zakodować wymagane pola dla różnych trybów.
    """
    required_common = ["accident_date", "accident_place", "accident_description"]
    required_zawiadomienie = ["injury_type"]
    required_wyjasnienia: List[str] = []

    required = set(required_common)
    if mode == Mode.NOTIFICATION:
        required.update(required_zawiadomienie)
    else:
        required.update(required_wyjasnienia)

    skipped = set(skipped_fields or [])
    result: List[MissingField] = []

    if case_state.reporter_type == ReporterType.PROXY and not case_state.proxy_document_attached:
        result.append(MissingField(
            field="proxy_document", 
            reason="W przypadku zgłoszenia przez pełnomocnika wymagane jest załączenie pełnomocnictwa."
        ))

    for field_name in required:
        if field_name in skipped:
            continue
        value = getattr(case_state, field_name, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            result.append(MissingField(field=field_name, reason="brak wartości"))
        elif (
            isinstance(value, str)
            and len(value.strip()) < 20
            and field_name == "accident_description"
        ):
            result.append(
                MissingField(field=field_name, reason="opis jest zbyt ogólny")
            )

    return result


FIELD_LABELS: dict[str, str] = {
    # Dane poszkodowanego
    "first_name": "imię poszkodowanego",
    "last_name": "nazwisko poszkodowanego",
    "pesel": "PESEL poszkodowanego",
    "date_of_birth": "data urodzenia poszkodowanego",
    "address_home": "adres zamieszkania poszkodowanego",
    "address_correspondence": "adres do korespondencji",
    # Dane działalności
    "nip": "NIP działalności",
    "regon": "REGON działalności",
    "business_address": "adres prowadzenia działalności",
    "pkd": "kod PKD działalności",
    "business_description": "opis rodzaju prowadzonej działalności",
    # Informacje o wypadku
    "accident_date": "data wypadku",
    "accident_time": "godzina wypadku",
    "accident_place": "miejsce wypadku",
    "planned_work_start": "planowana godzina rozpoczęcia pracy",
    "planned_work_end": "planowana godzina zakończenia pracy",
    "injury_type": "rodzaj urazu",
    "accident_description": "opis okoliczności i przyczyn wypadku",
    "first_aid_info": "informacje o udzielonej pierwszej pomocy / szpitalu",
    "proceedings_info": "informacje o postępowaniu (policja, prokuratura itp.)",
    "equipment_info": "informacje o maszynach/urządzeniach, BHP, środkach ochrony",
}

# Kategorie pytań – grupujemy pola w logiczne sekcje.
CATEGORY_DEFS: list[tuple[str, str, list[str]]] = [
    (
        "person",
        "dane poszkodowanego",
        [
            "first_name",
            "last_name",
            "pesel",
            "date_of_birth",
            "address_home",
            "address_correspondence",
        ],
    ),
    (
        "business",
        "dane działalności",
        ["nip", "regon", "business_address", "pkd", "business_description"],
    ),
    (
        "accident",
        "informacje o wypadku",
        [
            "accident_date",
            "accident_time",
            "accident_place",
            "planned_work_start",
            "planned_work_end",
            "injury_type",
            "accident_description",
            "first_aid_info",
            "proceedings_info",
            "equipment_info",
        ],
    ),
]


def human_field_label(field_name: str) -> str:
    """
    Przyjazne nazwy pól do komunikatu dla użytkownika.
    """
    return FIELD_LABELS.get(field_name, field_name)


def find_category_for_field(field_name: str) -> Optional[tuple[str, str, list[str]]]:
    for cat in CATEGORY_DEFS:
        if field_name in cat[2]:
            return cat
    return None


def find_category_by_label(label: str) -> Optional[tuple[str, str, list[str]]]:
    label_norm = label.strip().lower()
    for cat in CATEGORY_DEFS:
        _, category_label, _ = cat
        if category_label.lower() == label_norm:
            return cat
    return None


def field_name_from_label(label: str) -> Optional[str]:
    for key, value in FIELD_LABELS.items():
        if value == label:
            return key
    return None


def message_looks_like_skip(text: str) -> bool:
    """
    Bardzo prosta heurystyka: czy użytkownik chce pominąć odpowiedź.
    """
    t = text.strip().lower()
    if not t:
        return False
    phrases = [
        "nie chcę podawać",
        "nie chce podawać",
        "nie chcę tego podawać",
        "nie chce tego podawać",
        "nie chcę podać",
        "nie chce podać",
        "nie podam",
        "wolę nie podawać",
        "wole nie podawac",
        "wolę nie mówić",
        "wolę nie mowic",
        "nie chcę mówić",
        "nie chce mowic",
        "pomiń",
        "pomin",
        "pomijamy",
    ]
    return any(p in t for p in phrases)


def message_asks_next_category(text: str) -> bool:
    """
    Czy użytkownik prosi, żeby przejść do kolejnej kategorii pytań.
    """
    t = text.strip().lower()
    if not t:
        return False
    phrases = [
        "następna kategoria",
        "nastepna kategoria",
        "kolejna kategoria",
        "idź dalej z kategorią",
        "idz dalej z kategoria",
    ]
    return any(p in t for p in phrases)


def extract_category_label_from_text(text: str) -> Optional[str]:
    """
    Próbujemy wyciągnąć nazwę kategorii z tekstu pytania asystenta.
    Szukamy wzorców typu 'kategorii: X.' lub 'kategoria: X.'.
    """
    lowered = text.lower()
    for marker in ["kategorii:", "kategoria:"]:
        idx = lowered.find(marker)
        if idx != -1:
            start = idx + len(marker)
            # Wytnij do końca zdania / linii
            rest = text[start:].strip()
            for sep in [".", "\n"]:
                sep_idx = rest.find(sep)
                if sep_idx != -1:
                    rest = rest[:sep_idx]
                    break
            return rest.strip()
    return None


def detect_skip_with_llm(question_label: str, answer: str) -> bool:
    """
    Używa LLM do wykrycia, czy użytkownik odmawia podania danej informacji.
    Jeśli LLM nie jest dostępny, spada do prostej heurystyki.
    """
    llm = get_llm()
    if llm is None or ChatPromptTemplate is None:
        return message_looks_like_skip(answer)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Jesteś klasyfikatorem odpowiedzi użytkownika.\n"
                    "Masz ustalić, czy użytkownik NIE poda tej informacji w dalszym procesie, "
                    "bo albo wyraźnie odmawia, albo mówi, że taka informacja go nie dotyczy "
                    "(np. nie prowadzi działalności, nie ma NIP-u, nie pamięta daty).\n"
                    "Jeśli użytkownik odmawia podania informacji lub mówi, że jej nie posiada / "
                    "go nie dotyczy, odpowiedz dokładnie: YES.\n"
                    "Jeśli użytkownik próbuje odpowiedzieć (nawet nieprecyzyjnie, ale wygląda na to, "
                    "że chce udzielić informacji), odpowiedz dokładnie: NO.\n"
                    "Nie tłumacz się, nie dodawaj komentarzy, tylko jedno słowo: YES albo NO."
                ),
            ),
            (
                "human",
                (
                    "Pytanie asystenta (o jaką daną chodzi): {label}\n"
                    "Odpowiedź użytkownika: {answer}"
                ),
            ),
        ]
    )

    chain = prompt | llm | StrOutputParser()

    result = chain.invoke({"label": question_label, "answer": answer}).strip().upper()
    return result.startswith("YES")


def infer_skipped_fields_from_history(history: List[ChatTurn]) -> List[str]:
    """
    Przechodzi po historii:
    - gdy asystent pyta o kategorię lub konkretne pole,
    - a kolejna odpowiedź użytkownika wygląda jak odmowa / „to mnie nie dotyczy”
      lub prośba o przejście dalej,
    - oznaczamy odpowiednie pola jako "skipped".
    """
    skipped: set[str] = set()
    for i in range(len(history) - 1):
        turn = history[i]
        next_turn = history[i + 1]
        if turn.role != "assistant" or next_turn.role != "user":
            continue
        text = turn.content
        answer = next_turn.content

        # Najpierw spróbujmy zinterpretować to jako pytanie o kategorię.
        cat_label = extract_category_label_from_text(text)
        if cat_label:
            cat = find_category_by_label(cat_label)
            if cat and (
                message_asks_next_category(answer)
                or detect_skip_with_llm(cat_label, answer)
            ):
                _, _, category_fields = cat
                skipped.update(category_fields)
            continue

        # Jeśli to nie wygląda jak pytanie o kategorię, spróbujmy potraktować je
        # jak pytanie o konkretne pole (np. pole z etykietą).
        if ":" in text:
            label = (
                text.split(":")[-2 if text.count(":") > 1 else 0]
                .splitlines()[-1]
                .strip()
            )
            field_name = field_name_from_label(label)
            if field_name and detect_skip_with_llm(label, answer):
                skipped.add(field_name)
    return list(skipped)


def extract_case_state_with_llm(
    previous_state: CaseState,
    message: str,
    mode: Mode,
    today: str,
    conversation_history: List[ChatTurn],
) -> CaseState:
    """
    Wykorzystuje LangChain + LLM (Gemini) do uzupełnienia CaseState na podstawie wiadomości.
    Jeśli Gemini nie jest dostępny, działa w trybie fallback.
    """
    llm = get_llm()
    if llm is None or ChatPromptTemplate is None or PydanticOutputParser is None:
        # Fallback: tylko podmień opis wypadku na podstawie wiadomości
        return previous_state.model_copy(
            update={
                "accident_description": message.strip()
                or previous_state.accident_description
            }
        )

    parser = PydanticOutputParser(pydantic_object=CaseState)

    history_text = "\n".join(
        f"{turn.role}: {turn.content}" for turn in conversation_history[-10:]
    )

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Jesteś asystentem pomagającym wypełnić dane o wypadku "
                    "dla ZUS. Uzupełniasz strukturalne pola w JSON-ie "
                    "na podstawie rozmowy z użytkownikiem.\n\n"
                    "Dzisiejsza data (czas serwera backendu): {today}\n\n"
                    "Zawsze zwracaj pełny JSON zgodny ze schematem CaseState.\n"
                    "Jeśli czegoś nie wiesz, pozostaw dane pola bez zmian."
                ),
            ),
            (
                "human",
                (
                    "Aktualny stan danych (CaseState) w formacie JSON:\n"
                    "{current_state}\n\n"
                    "Historia rozmowy (ostatnie wiadomości):\n"
                    "{history}\n\n"
                    "Tryb: {mode}\n\n"
                    "Nowa wiadomość użytkownika:\n"
                    "{message}\n\n"
                    "Twoje zadanie:\n"
                    "- wywnioskuj i uzupełnij tylko te pola, które można "
                    "jednoznacznie określić na podstawie rozmowy,\n"
                    "- pozostałe pola pozostaw bez zmian (przepisz ich "
                    "dotychczasową wartość),\n"
                    "- odpowiedz wyłącznie JSON-em pasującym do schematu CaseState."
                ),
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        updated_state: CaseState = chain.invoke(
            {
                "current_state": previous_state.model_dump(),
                "mode": mode.value,
                "message": message,
                "today": today,
                "history": history_text,
            }
        )
        return updated_state
    except Exception as e:
        # Fallback: tylko podmień opis wypadku na podstawie wiadomości
        return previous_state.model_copy(
            update={
                "accident_description": message.strip()
                or previous_state.accident_description
            }
        )


def run_assistant_pipeline(
    case_id: str,
    message: str,
    mode: Mode,
    previous_state: Optional[CaseState] = None,
    conversation_history: Optional[List[ChatTurn]] = None,
) -> AssistantMessageResponse:
    """
    Miejsce na LangChain:
    - tutaj w przyszłości:
      - odczytasz CaseState z bazy na podstawie case_id,
      - uruchomisz chain do ekstrakcji informacji z message + historii rozmowy,
      - zaktualizujesz CaseState,
      - policzysz brakujące pola,
      - wygenerujesz kolejne pytania i draft dokumentu.

    Póki co używamy prostego chaina:
    - LLM uzupełnia CaseState na podstawie wiadomości,
    - prosta funkcja Pythonowa wykrywa braki.
    """
    # TODO: tutaj podłącz w przyszłości storage (np. bazę danych) po case_id
    base_state = previous_state or CaseState()

    # Dzisiejsza data z punktu widzenia backendu (ISO)
    today = date.today().isoformat()

    history = conversation_history or []

    # LangChain: próba uzupełnienia CaseState na podstawie wiadomości i historii
    case_state = extract_case_state_with_llm(
        previous_state=base_state,
        message=message,
        mode=mode,
        today=today,
        conversation_history=history,
    )

    # Wyznacz pola, których użytkownik nie chce podawać – na podstawie historii + bieżącej odpowiedzi.
    skipped_from_history = set(infer_skipped_fields_from_history(history))
    # Sprawdź, czy bieżąca wiadomość jest odmową odpowiedzi lub prośbą o przejście
    # do kolejnej kategorii na podstawie ostatniego pytania asystenta.
    skipped_current: set[str] = set()
    if history:
        last_assistant = next(
            (t for t in reversed(history) if t.role == "assistant"), None
        )
        if last_assistant:
            text = last_assistant.content

            # Jeśli użytkownik prosi o przejście do następnej kategorii,
            # pomijamy wszystkie jeszcze niewypełnione pola z bieżącej kategorii.
            if message_asks_next_category(message):
                cat_label = extract_category_label_from_text(text)
                if cat_label:
                    cat = find_category_by_label(cat_label)
                    if cat:
                        _, _, category_fields = cat
                        for name in category_fields:
                            value = getattr(case_state, name, None)
                            if value is None or (
                                isinstance(value, str) and not value.strip()
                            ):
                                skipped_current.add(name)
            else:
                # Standardowy przypadek: sprawdzamy odmowę dla konkretnego pola
                if ":" in text:
                    label = (
                        text.split(":")[-2 if text.count(":") > 1 else 0]
                        .splitlines()[-1]
                        .strip()
                    )
                    field_name = field_name_from_label(label)
                    if field_name and detect_skip_with_llm(label, message):
                        skipped_current.add(field_name)

    skipped_all = list(skipped_from_history | skipped_current)

    # Sprawdź braki obowiązkowe (dla missing_fields), ignorując pola, które użytkownik świadomie pominął.
    missing = simple_missing_fields(case_state, mode, skipped_fields=skipped_all)

    # Kolejność WSZYSTKICH pól, o które chcemy po kolei pytać,
    # tak długo jak użytkownik nie odmówi (skipped_fields) i pole jest puste.
    question_order = [
        "reporter_type",
        # Dane poszkodowanego
        "first_name",
        "last_name",
        "pesel",
        "date_of_birth",
        "address_home",
        "address_correspondence",
        # Dane działalności
        "nip",
        "regon",
        "business_address",
        "pkd",
        "business_description",
        # Informacje o wypadku
        "accident_date",
        "accident_time",
        "accident_place",
        "planned_work_start",
        "planned_work_end",
        "injury_type",
        "accident_description",
        "first_aid_info",
        "proceedings_info",
        "equipment_info",
    ]

    skipped = set(skipped_all)
    next_field = None
    for name in question_order:
        if name in skipped:
            continue
        value = getattr(case_state, name, None)
        if value is None or (isinstance(value, str) and not value.strip()):
            next_field = name
            break

    if next_field:
        if next_field == "reporter_type":
            assistant_reply = (
                "Dzień dobry. Jestem wirtualnym asystentem ZUS.\n\n"
                "Zanim zaczniemy: Czy zgłaszasz wypadek osobiście (jako poszkodowany), "
                "czy występujesz jako pełnomocnik?"
            )
        elif next_field == "accident_description":
            assistant_reply = (
                "Przejdźmy do najważniejszej części - przebiegu wypadku. "
                "Aby ZUS mógł prawidłowo ocenić zdarzenie, musimy ustalić tzw. drzewo przyczyn.\n\n"
                "Opisz proszę sytuację, odpowiadając kolejno na trzy pytania:\n"
                "1. Co robiłeś/aś bezpośrednio przed zdarzeniem? (Jaka to była czynność? np. 'wchodziłem po drabinie', 'niosłem paczkę')\n"
                "2. Co dokładnie się stało? (Jaki fakt spowodował uraz? np. 'noga ześlizgnęła się ze stopnia', 'potknąłem się o przewód')\n"
                "3. Jaki jest skutek? (Jaki to uraz i jakiej części ciała?)\n\n"
                "Możesz to opisać własnymi słowami w jednej wiadomości."
            )
        else:

            category = find_category_for_field(next_field)
            if category is not None:
                _, category_label, category_fields = category
                # W tej kategorii pytamy tylko o pola, które nadal są puste
                # (i nie zostały oznaczone jako pominięte).
                missing_in_category = []
                for name in category_fields:
                    if name in skipped:
                        continue
                    value = getattr(case_state, name, None)
                    if value is None or (isinstance(value, str) and not value.strip()):
                        missing_in_category.append(name)

                labels = [human_field_label(name) for name in missing_in_category]
                fields_list = ", ".join(labels)

                # Pierwsza interakcja — przedstaw zasady raz na początku.
                if not history:
                    assistant_reply = (
                        "Dzień dobry! Opisz proszę, co się wydarzyło.\n\n"
                        "Potem przejdziemy po kilku grupach pytań potrzebnych do formularza. "
                        "Możesz mówić swobodnie, tak jak Ci wygodnie – jeśli czegoś nie chcesz podawać, "
                        "napisz po prostu, że tę informację pomijamy albo że wolisz następną kategorię.\n\n"
                        f"Na początek zatrzymajmy się przy kategorii: {category_label}. "
                        f"Napisz w kilku zdaniach, co uważasz za ważne w tym temacie. "
                        f"Jeśli chcesz, możesz przy okazji wspomnieć o rzeczach typu: {fields_list}."
                    )
                else:
                    # Kolejne pytania – jedna grupa pól na raz, w luźniejszej formie.
                    assistant_reply = (
                        f"Teraz kategoria: {category_label}. "
                        "Napisz po prostu, co uważasz za ważne w tym obszarze. "
                        f"Jeśli chcesz, możesz też doprecyzować rzeczy typu: {fields_list}. "
                        "Możesz pominąć dowolne elementy albo poprosić o następną kategorię."
                    )
            else:
                # Gdyby pole nie należało do żadnej kategorii (nie powinno się zdarzyć).
                label = human_field_label(next_field)
                assistant_reply = f"{label}:"
    else:
        assistant_reply = (
            "Dziękuję, to wszystkie pytania o dane wymagane w formularzu. "
            "Jeśli chcesz coś doprecyzować lub dodać, napisz to w kolejnej wiadomości."
        )

    return AssistantMessageResponse(
        assistant_reply=assistant_reply,
        missing_fields=missing,
        case_state_preview=case_state,
    )


def evaluate_case_from_documents(
    documents: List[CaseDocument], case_id: str
) -> CaseEvaluationResult:
    """
    Uruchamia złożony pipeline LLM na komplecie dokumentów:
    - ujednolica stan faktyczny (CaseState),
    - wykrywa rozbieżności,
    - wskazuje brakujące informacje i dokumenty,
    - wydaje opinię, czy zdarzenie jest wypadkiem podczas prowadzenia pozarolniczej DG,
    - generuje projekt karty wypadku.
    """
    llm = get_llm()
    if llm is None or ChatPromptTemplate is None or PydanticOutputParser is None:
        # Fallback: minimalna implementacja bez LLM – zwracamy puste rozstrzygnięcie.
        base_state = CaseState()
        missing = simple_missing_fields(base_state, Mode.NOTIFICATION)
        return CaseEvaluationResult(
            normalized_case_state=base_state,
            discrepancies=[],
            missing_fields=missing,
            missing_documents=[],
            opinion=OpinionOutcome.INCONCLUSIVE,
            opinion_explanation=(
                "Brak dostępnego modelu LLM – nie można przeprowadzić pełnej oceny na podstawie dokumentów."
            ),
            accident_card_draft=(
                "Brak projektu karty wypadku – środowisko LLM nie jest dostępne."
            ),
        )

    parser = PydanticOutputParser(pydantic_object=CaseEvaluationResult)

    docs_as_text = [
        {
            "name": d.name,
            "type": d.type or "",
            "text": d.text,
        }
        for d in documents
    ]

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                (
                    "Jesteś ekspertem ZUS ds. wypadków przy prowadzeniu pozarolniczej "
                    "działalności gospodarczej.\n"
                    "Na podstawie kompletu dokumentów musisz:\n"
                    "1) odczytać i zrozumieć treść dokumentów (zakładamy, że OCR już został wykonany),\n"
                    "2) ujednolicić stan faktyczny sprawy w strukturze CaseState,\n"
                    "3) wskazać rozbieżności pomiędzy dokumentami (np. różne daty, różne miejsca wypadku, "
                    "różne dane świadków, różne opisy zdarzenia),\n"
                    "4) wskazać brakujące informacje i/lub brakujące dokumenty, które są potrzebne do "
                    "rzetelnej oceny zdarzenia,\n"
                    "5) wydać jednoznaczną opinię, czy zdarzenie jest wypadkiem podczas prowadzenia "
                    "pozarolniczej działalności gospodarczej,\n"
                    "6) szczegółowo uzasadnić swoją opinię,\n"
                    "7) przygotować projekt karty wypadku (w formie tekstowej, z polami zbliżonymi do "
                    "formularza ZUS, z wypełnionymi danymi na podstawie ustalonego stanu faktycznego).\n\n"
                    "Zawsze zwracaj wynik w formacie JSON ściśle zgodnym ze schematem CaseEvaluationResult."
                ),
            ),
            (
                "human",
                (
                    "Identyfikator sprawy: {case_id}\n\n"
                    "Komplet dokumentów (po OCR) w formacie JSON:\n"
                    "{documents_json}\n\n"
                    "Twoje zadanie:\n"
                    "- przeanalizuj wszystkie dokumenty razem (załóż, że mogą zawierać błędy i sprzeczne dane),\n"
                    "- ujednolicz stan faktyczny w strukturze CaseState,\n"
                    "- wskaż wyraźnie wszystkie istotne rozbieżności pomiędzy dokumentami,\n"
                    "- wskaż, jakich informacji lub dokumentów brakuje,\n"
                    "- wydaj opinię (opinion) oraz szczegółowe uzasadnienie (opinion_explanation),\n"
                    "- przygotuj projekt karty wypadku (accident_card_draft) – może być jako dobrze "
                    "sformatowany tekst z nagłówkami i polami.\n"
                    "Odpowiedz TYLKO JSON-em zgodnym ze schematem CaseEvaluationResult."
                ),
            ),
        ]
    )

    chain = prompt | llm | parser

    try:
        result: CaseEvaluationResult = chain.invoke(
            {
                "case_id": case_id,
                "documents_json": docs_as_text,
            }
        )
        return result
    except Exception:
        # Bezpieczny fallback: nie przerywamy działania API, tylko zwracamy odpowiedź INCONCLUSIVE.
        base_state = CaseState()
        missing = simple_missing_fields(base_state, Mode.NOTIFICATION)
        return CaseEvaluationResult(
            normalized_case_state=base_state,
            discrepancies=[],
            missing_fields=missing,
            missing_documents=[],
            opinion=OpinionOutcome.INCONCLUSIVE,
            opinion_explanation=(
                "Wystąpił błąd podczas przetwarzania dokumentów przez model LLM – "
                "nie można przeprowadzić pełnej oceny."
            ),
            accident_card_draft=(
                "Projekt karty wypadku nie został wygenerowany z powodu błędu LLM."
            ),
        )


@app.post("/api/assistant/message", response_model=AssistantMessageResponse)
async def assistant_message(
    payload: AssistantMessageRequest,
) -> AssistantMessageResponse:
    """
    Główny endpoint czatu:
    - przyjmuje wiadomość użytkownika,
    - uruchamia pipeline asystenta,
    - zwraca tekst odpowiedzi, listę braków i podgląd stanu sprawy.
    """
    return run_assistant_pipeline(
        case_id=payload.case_id,
        message=payload.message,
        mode=payload.mode,
        previous_state=payload.case_state,
        conversation_history=payload.conversation_history,
    )


@app.post("/api/case/evaluate-documents", response_model=CaseEvaluationResponse)
async def evaluate_documents(payload: CaseEvaluationRequest) -> CaseEvaluationResponse:
    """
    Endpoint dla II etapu oceny:
    - przyjmuje komplet dokumentów w formie tekstowej (po OCR),
    - uruchamia LLM do analizy,
    - zwraca ujednolicony stan faktyczny, rozbieżności, braki, opinię i projekt karty wypadku.
    """
    evaluation = evaluate_case_from_documents(
        documents=payload.documents, case_id=payload.case_id
    )
    return CaseEvaluationResponse(case_id=payload.case_id, evaluation=evaluation)


@app.post("/api/ocr/read-document")
async def read_document_ocr(file: UploadFile = File(...)) -> dict:
    """
    OCR endpoint.

    Accepts an uploaded image file (e.g. PNG/JPEG) and returns text extracted
    from the document using Tesseract OCR.
    """
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        text = extract_text_from_image(contents)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(status_code=500, detail="OCR failed") from exc

    return {
        "filename": file.filename,
        "text": text,
    }
