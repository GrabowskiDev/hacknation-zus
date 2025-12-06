import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";

// Typy dla wyniku analizy
interface AnalysisResult {
  decision: "approved" | "rejected";
  confidence: number;
  justification: string[];
  draftOpinion: string;
}

function OfficialView() {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Obsługa wyboru plików
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResult(null); // Reset wyników po dodaniu nowych plików
    }
  };

  // Symulacja analizy AI (Mock)
  const handleAnalyze = () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);

    // Symulujemy opóźnienie 2 sekundy (normalnie tu byłby fetch do backendu)
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        decision: "approved", // lub "rejected"
        confidence: 94,
        justification: [
          "Zdarzenie miało charakter nagły (upadek z drabiny).",
          "Przyczyna zewnętrzna potwierdzona (pęknięcie szczebla).",
          "Uraz udokumentowany w karcie informacyjnej ze szpitala (złamanie kości piszczelowej).",
          "Związek z pracą zachowany (malowanie lokalu usługowego).",
        ],
        draftOpinion: `OPINIA W SPRAWIE UZNANIA ZDARZENIA ZA WYPADEK PRZY PRACY\n\nNa podstawie przedłożonej dokumentacji, zdarzenie z dnia 12.12.2024 r. uznaje się za wypadek przy pracy.\n\nUZASADNIENIE:\nAnaliza zgromadzonego materiału dowodowego wykazała spełnienie wszystkich przesłanek definicji wypadku przy pracy określonych w art. 3 ustawy wypadkowej. Zdarzenie było nagłe, wywołane przyczyną zewnętrzną i nastąpiło w związku z wykonywaniem czynności w ramach prowadzonej działalności gospodarczej.`,
      });
    }, 2500);
  };

  return (
    <main className="flex flex-col justify-center h-screen w-full bg-slate-50 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      {/* Nagłówek */}
      <div className="max-w-5xl mx-auto w-full mb-8">
        <h1 className="text-2xl font-bold text-[#007834] mb-2">
          Panel Decyzyjny (ZANT II)
        </h1>
        <p className="text-slate-600">
          Moduł wsparcia dla pracowników ZUS. Wgraj dokumentację (PDF), aby
          uzyskać wstępną kwalifikację zdarzenia i projekt opinii.
        </p>
      </div>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEWA KOLUMNA: Upload */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Obszar Dropzone */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-slate-300 hover:border-[#007834] transition-colors flex flex-col items-center justify-center text-center h-64 group">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer w-full h-full flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-green-50 text-[#007834] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <span className="font-semibold text-slate-700">
                Wybierz pliki PDF
              </span>
              <span className="text-xs text-slate-400 mt-2">
                Maksymalnie 20MB
              </span>
            </label>
          </div>

          {/* Lista plików */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-sm text-slate-700">
                Wgrane dokumenty ({files.length})
              </div>
              <ul className="divide-y divide-slate-100">
                {files.map((file, idx) => (
                  <li
                    key={idx}
                    className="p-3 flex items-center gap-3 text-sm text-slate-600"
                  >
                    <FileText size={16} className="text-[#007834]" />
                    <span className="truncate">{file.name}</span>
                  </li>
                ))}
              </ul>
              <div className="p-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full py-3 bg-[#007834] text-white font-semibold rounded-xl hover:bg-[#005f2a] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />{" "}
                      Analizuję...
                    </>
                  ) : (
                    "Rozpocznij Analizę"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PRAWA KOLUMNA: Wyniki */}
        <div className="lg:col-span-2">
          {!result && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl min-h-[300px]">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p>Wyniki analizy pojawią się tutaj</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[300px]">
              <Loader2 size={64} className="text-[#007834] animate-spin mb-6" />
              <h3 className="text-lg font-semibold text-slate-700">
                Przetwarzanie dokumentacji...
              </h3>
              <p className="text-slate-500 text-sm mt-2">
                Weryfikacja przesłanek wypadku przy pracy
              </p>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Karta Decyzji */}
              <div
                className={`p-6 rounded-2xl border flex items-start gap-4 shadow-sm ${
                  result.decision === "approved"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                {result.decision === "approved" ? (
                  <CheckCircle className="text-green-600 shrink-0" size={32} />
                ) : (
                  <XCircle className="text-red-600 shrink-0" size={32} />
                )}
                <div>
                  <h2
                    className={`text-xl font-bold ${
                      result.decision === "approved"
                        ? "text-green-800"
                        : "text-red-800"
                    }`}
                  >
                    {result.decision === "approved"
                      ? "Rekomendacja: UZNAĆ ZA WYPADEK"
                      : "Rekomendacja: ODMOWA UZNANIA"}
                  </h2>
                  <p className="text-sm mt-1 opacity-80">
                    Pewność modelu: <strong>{result.confidence}%</strong>
                  </p>
                </div>
              </div>

              {/* Uzasadnienie Punktowe */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#007834] rounded-full"></div>
                  Analiza przesłanek ustawowych
                </h3>
                <ul className="space-y-3">
                  {result.justification.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-slate-700 text-sm"
                    >
                      <CheckCircle
                        size={16}
                        className="text-[#007834] mt-0.5 shrink-0"
                      />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Projekt Opinii */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 relative">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
                  Wygenerowany Projekt Opinii
                </h3>
                <textarea
                  readOnly
                  value={result.draftOpinion}
                  className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 resize-none focus:outline-none"
                />
                <div className="mt-4 flex justify-end">
                  <button className="text-[#007834] font-semibold text-sm hover:underline">
                    Pobierz jako PDF
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default OfficialView;
