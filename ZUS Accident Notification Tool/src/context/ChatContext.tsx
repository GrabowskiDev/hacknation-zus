import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { CaseState, ChatTurn, AssistantResponse } from "../types";
import { v4 as uuidv4 } from "uuid";

interface ChatContextType {
  messages: ChatTurn[];
  caseState: CaseState;
  setCaseState: React.Dispatch<React.SetStateAction<CaseState>>;
  isLoading: boolean;
  sendMessage: (text: string) => Promise<void>;
  missingFields: string[]; // Lista nazw brakujących pól
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  // Stan konwersacji
  const [messages, setMessages] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content:
        "Cześć! Jestem asystentem zgłoszenia wypadku ZUS. Jak mogę Ci pomóc? Możesz odpowiedzieć pełnym zeznaniem zdarzenia. Jeśli będą jakieś brakujące informacje, poproszę Cię o nie. Możesz odmówić podania niektórych danych, ale pamiętaj, że może to wpłynąć na proces zgłoszenia.",
    },
  ]);

  // Stan formularza (Twoje CaseState)
  const [caseState, setCaseState] = useState<CaseState>({ witnesses: [] });

  // Stan ładowania i brakujących pól
  const [isLoading, setIsLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const sendMessage = async (text: string) => {
    // 1. Dodaj wiadomość usera optymistycznie
    const userMessage: ChatTurn = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Przygotuj payload zgodnie z Twoim modelem AssistantMessageRequest
      const payload = {
        case_id: uuidv4(),
        message: text,
        mode: "notification",
        conversation_history: messages,
        case_state: caseState,
      };

      // 3. Strzał do Twojego API FastAPI
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

      // 4. Aktualizacja stanu na podstawie odpowiedzi AI
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

  return (
    <ChatContext.Provider
      value={{
        messages,
        caseState,
        setCaseState,
        isLoading,
        sendMessage,
        missingFields,
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
