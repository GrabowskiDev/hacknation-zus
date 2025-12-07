import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import type { CaseState, ChatTurn, AssistantResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

import pkdList from "@/../data/pkd.json";

// Klucze do localStorage
const STORAGE_KEYS = {
  MESSAGES: "zant_chat_history",
  CASE_STATE: "zant_case_state",
  CASE_ID: "zant_case_id",
};

interface ChatContextType {
  messages: ChatTurn[];
  caseState: CaseState;
  setCaseState: React.Dispatch<React.SetStateAction<CaseState>>;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  missingFields: string[];
  appendAssistantMessage: (text: string) => void;
  clearSession: () => void; // Opcjonalnie: funkcja do resetu
  updatePkd: (code: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Domyślna wiadomość powitalna
const INITIAL_MESSAGE: ChatTurn = {
  role: "assistant",
  content:
    "Cześć! Jestem asystentem zgłoszenia wypadku ZUS. Jak mogę Ci pomóc? Możesz odpowiedzieć pełnym zeznaniem zdarzenia. Jeśli będą jakieś brakujące informacje, poproszę Cię o nie.",
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // 1. Inicjalizacja ID Sprawy (Lazy Init)
  const [caseId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.CASE_ID);
    if (savedId) return savedId;

    const newId = uuidv4();
    localStorage.setItem(STORAGE_KEYS.CASE_ID, newId);
    return newId;
  });

  // 2. Inicjalizacja Wiadomości (Lazy Init)
  const [messages, setMessages] = useState<ChatTurn[]>(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return savedMessages ? JSON.parse(savedMessages) : [INITIAL_MESSAGE];
    } catch (e) {
      console.error("Błąd parsowania historii czatu:", e);
      return [INITIAL_MESSAGE];
    }
  });

  // 3. Inicjalizacja Stanu Sprawy (Lazy Init)
  const [caseState, setCaseState] = useState<CaseState>(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.CASE_STATE);
      return savedState ? JSON.parse(savedState) : { witnesses: [] };
    } catch (e) {
      console.error("Błąd parsowania stanu sprawy:", e);
      return { witnesses: [] };
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // --- EFEKTY DO ZAPISYWANIA (PERSISTENCE) ---

  // Zapisz wiadomości przy każdej zmianie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Zapisz stan sprawy przy każdej zmianie
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CASE_STATE, JSON.stringify(caseState));
  }, [caseState]);

  // --- PKD ---
  const pkdMap = useMemo(() => {
    const map = new Map<string, string>();
    pkdList.forEach((item) => {
      // Kluczem jest "czysty" kod (bez kropek, spacji), np. "0111Z"
      const cleanKey = item.code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
      map.set(cleanKey, item.desc);
    });
    return map;
  }, []);

  const updatePkd = (inputCode: string) => {
    // 1. Normalizujemy to co wpisał użytkownik (usuwamy kropki, spacje, wielkie litery)
    const normalizedInput = inputCode
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    // 2. Szukamy opisu
    const description = pkdMap.get(normalizedInput) || "";

    // 3. Aktualizujemy stan (zapisujemy zarówno kod wpisany, jak i znaleziony opis)
    // Zakładam, że w CaseState masz pola 'pkdCode' i 'pkdDescription'
    setCaseState((prev) => ({
      ...prev,
      pkd: inputCode, // Zapisujemy to co wpisuje user (dla input value)
      business_description: description, // Automatycznie wypełniamy opis
    }));
  };

  // --- LOGIKA BIZNESOWA ---

  const sendMessage = async (text: string) => {
    const userMessage: ChatTurn = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const payload = {
        case_id: caseId, // Używamy stałego ID z pamięci!
        message: text,
        mode: "notification",
        conversation_history: messages, // Wysyłamy historię sprzed dodania userMessage (lub dodaj userMessage tutaj jeśli backend tego wymaga)
        case_state: caseState,
      };

      const response = await fetch(
        "http://localhost:8000/api/assistant/message",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Błąd komunikacji z AI");

      const data: AssistantResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.assistant_reply },
      ]);
      setCaseState(data.case_state_preview);
      setMissingFields(data.missing_fields.map((m) => m.field));
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Przepraszam, wystąpił błąd połączenia z serwerem.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Funkcja pomocnicza do czyszczenia sesji (np. przycisk "Nowe Zgłoszenie")
  const clearSession = () => {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.CASE_STATE);
    localStorage.removeItem(STORAGE_KEYS.CASE_ID);
    window.location.reload(); // Najprostszy sposób na reset stanu
  };

  const appendAssistantMessage = (text: string) => {
    setMessages((prev) => [...prev, { role: "assistant", content: text }]);
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        caseState,
        setCaseState,
        isLoading,
        sendMessage,
        missingFields,
        appendAssistantMessage,
        clearSession,
        updatePkd,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used within a ChatProvider");
  return context;
};
