from __future__ import annotations

import os
from enum import Enum
from typing import Any, List, Optional
from datetime import date
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.prompts import ChatPromptTemplate


load_dotenv()  # load GOOGLE_API_KEY and friends from .env


class Mode(str, Enum):
    NOTIFICATION = "notification"
    EXPLANATION = "explanation"


class Witness(BaseModel):
    first_name: str = Field(..., description="Imię świadka")
    last_name: str = Field(..., description="Nazwisko świadka")
    address: Optional[str] = Field(None, description="Adres świadka")


class CaseState(BaseModel):
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


app = FastAPI(title="ZANT Backend", version="0.1.0")


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


def simple_missing_fields(case_state: CaseState, mode: Mode) -> List[MissingField]:
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

    result: List[MissingField] = []
    for field_name in required:
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


def human_field_label(field_name: str) -> str:
    """
    Przyjazne nazwy pól do komunikatu dla użytkownika.
    """
    labels = {
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
    return labels.get(field_name, field_name)


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

    missing = simple_missing_fields(case_state, mode)

    if missing:
        missing_names = ", ".join(human_field_label(m.field) for m in missing)
        assistant_reply = (
            "Dziękuję za opis sytuacji. "
            f"Brakuje mi jeszcze następujących informacji: {missing_names}. "
            "Proszę je uzupełnić prostym opisem po polsku."
        )
    else:
        assistant_reply = (
            "Dziękuję, na ten moment mam komplet podstawowych informacji. "
            "Możemy przejść do przygotowania projektu dokumentu."
        )

    return AssistantMessageResponse(
        assistant_reply=assistant_reply,
        missing_fields=missing,
        case_state_preview=case_state,
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
