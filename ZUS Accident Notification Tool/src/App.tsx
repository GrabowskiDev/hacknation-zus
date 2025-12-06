import "./App.css";
import ConversationalForm from "@/components/chat/ConversationalForm";
import FormView from "./components/form/FormView";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <main className="h-screen w-full bg-[#f0fdf4] flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden">
      <div className="w-full max-w-[1600px] flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        <ChatProvider>
          {/* LEWA KOLUMNA: Czat */}
          {/* Zmieniono: Dodano 'bg-white shadow-2xl' i usunięto 'lg:shadow-none/lg:bg-transparent' */}
          <section className="h-full w-full overflow-hidden flex flex-col rounded-3xl bg-white border border-slate-100 shadow-2xl relative z-10">
            <ConversationalForm />
          </section>

          {/* PRAWA KOLUMNA: Formularz */}
          {/* Tutaj też upewniamy się, że jest shadow-2xl dla symetrii */}
          <section className="hidden lg:flex h-full w-full flex-col overflow-hidden bg-white rounded-3xl shadow-2xl border border-slate-100 relative transition-all duration-300 z-10">
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
