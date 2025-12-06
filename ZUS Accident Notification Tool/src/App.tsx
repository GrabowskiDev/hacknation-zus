import "./App.css";
import ConversationalForm from "./chat/ConversationalForm";
import ZusForm from "./zus_form/ZusForm";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 lg:p-8">
      {/* Main Card Container */}
      <div className="w-full max-w-[1600px] h-[90vh] grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <ChatProvider>
          {/* Left Column: Chat */}
          <section className="h-full w-full overflow-hidden">
            <ConversationalForm />
          </section>

          {/* Right Column: Form */}
          <section className="hidden lg:block h-full w-full overflow-hidden bg-white rounded-3xl shadow-xl border border-slate-100 relative">
            {/* Header for Form Side */}
            <div className="absolute top-0 left-0 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 z-10 flex items-center px-6">
              <h2 className="text-lg font-semibold text-slate-800">
                Podgląd Formularza
              </h2>
            </div>
            <div className="pt-16 h-full">
              <ZusForm />
            </div>
          </section>

          {/* Mobile view handling for the form could be added here (e.g. tabs), 
              but strictly following the prompt's layout structure: */}
        </ChatProvider>
      </div>
    </main>
  );
}

export default App;
