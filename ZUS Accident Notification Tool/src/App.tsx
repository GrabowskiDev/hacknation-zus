import { useState } from "react";
import { ChatProvider } from "@/context/ChatContext";
import ConversationalForm from "@/components/chat/ConversationalForm";
import FormView from "@/components/form/FormView";
import { MessageSquare, FileText } from "lucide-react"; // Opcjonalne ikony dla lepszego wyglądu

function App() {
  // Stan do zarządzania widokiem na mobile (domyślnie czat)
  const [mobileTab, setMobileTab] = useState<"chat" | "form">("chat");

  return (
    <main className="h-screen w-full bg-[#f0fdf4] flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden font-sans">
      {/* Główny Kontener */}
      <div className="w-full max-w-[1600px] flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-8">
        {/* --- MOBILE TOGGLE (Widoczny tylko na mobile) --- */}
        <div className="lg:hidden flex-none mb-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-200 flex">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
              ${
                mobileTab === "chat"
                  ? "bg-[#007834] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <MessageSquare size={16} />
            Asystent
          </button>
          <button
            onClick={() => setMobileTab("form")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
              ${
                mobileTab === "form"
                  ? "bg-[#007834] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
          >
            <FileText size={16} />
            Podgląd Formularza
          </button>
        </div>

        <ChatProvider>
          {/* --- LEWA KOLUMNA: Czat --- */}
          {/* Logika wyświetlania: 
              - Mobile: Widoczny tylko gdy mobileTab === 'chat'
              - Desktop (lg): Zawsze widoczny (lg:flex)
          */}
          <section
            className={`
              h-full w-full overflow-hidden flex-col rounded-3xl bg-white border border-slate-100 shadow-2xl relative z-10
              ${mobileTab === "chat" ? "flex" : "hidden"} 
              lg:flex
            `}
          >
            <ConversationalForm />
          </section>

          {/* --- PRAWA KOLUMNA: Formularz --- */}
          {/* Logika wyświetlania:
              - Mobile: Widoczny tylko gdy mobileTab === 'form'
              - Desktop (lg): Zawsze widoczny (lg:flex)
          */}
          <section
            className={`
              h-full w-full flex-col overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-100 relative transition-all duration-300 z-10
              ${mobileTab === "form" ? "flex" : "hidden"} 
              lg:flex
            `}
          >
            {/* Nagłówek prawej kolumny */}
            <div className="flex-none h-16 bg-white border-b border-slate-100 flex items-center px-6 z-10">
              <div className="w-1.5 h-6 bg-[#007834] rounded-full mr-3"></div>
              <h2 className="text-lg font-bold text-slate-800">
                Podgląd Formularza
              </h2>
            </div>

            <div className="flex-1 min-h-0 relative bg-white">
              <FormView />
            </div>
          </section>
        </ChatProvider>
      </div>
    </main>
  );
}

export default App;
