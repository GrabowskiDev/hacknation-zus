import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // Obsługa tabel, przekreśleń itp.
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  FileOutput,
} from "lucide-react";
import { useAccidentAnalysis } from "@/hooks/useAccidentAnalysis";

// Teraz BackendResponse zwraca string w polu summary
interface BackendResponse {
  summary: string;
  file_count: number;
}

function OfficialView() {
  const {
    files,
    isAnalyzing,
    markdownResult,
    error,
    handleFileChange,
    handleAnalyze,
    copyToClipboard,
  } = useAccidentAnalysis();

  return (
    <main className="flex flex-col justify-center h-screen w-full bg-slate-50 p-4 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full mb-8">
        <h1 className="text-2xl font-bold text-[#007834] mb-2">
          Panel Decyzyjny (ZANT II) - Widok Raportu
        </h1>
        <p className="text-slate-600">
          Wgraj pliki PDF, aby wygenerować zbiorcze podsumowanie faktów
          (Markdown).
        </p>
      </div>

      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEWA KOLUMNA: Upload (Mniejsza - 4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-dashed border-slate-300 hover:border-[#007834] transition-colors flex flex-col items-center justify-center text-center h-64 group relative">
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
                Wgraj pliki PDF
              </span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 font-semibold text-sm text-slate-700">
                Dokumentacja ({files.length})
              </div>
              <ul className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
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
                      {" "}
                      <Loader2 className="animate-spin" size={18} />{" "}
                      Przetwarzam...{" "}
                    </>
                  ) : (
                    "Generuj Raport"
                  )}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* PRAWA KOLUMNA: Renderowanie Markdown (Większa - 8/12) */}
        <div className="lg:col-span-8 text-black">
          {!markdownResult && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl min-h-[400px]">
              <FileOutput size={48} className="mb-4 opacity-20" />
              <p>Tutaj pojawi się wygenerowany dokument</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
              <Loader2 size={64} className="text-[#007834] animate-spin mb-6" />
              <h3 className="text-lg font-semibold text-slate-700">
                Analiza treści...
              </h3>
            </div>
          )}

          {markdownResult && (
            <div className="bg-white rounded-2xl shadow-md border border-slate-200 min-h-[600px] flex flex-col animate-in fade-in slide-in-from-bottom-4 pb-4 h-128 duration-500">
              {/* Pasek narzędzi dokumentu */}
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <span className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                  Podsumowanie faktów
                </span>
                <button className="text-sm text-[#007834] font-medium hover:underline">
                  Kopiuj do schowka
                </button>
              </div>

              {/* OBSZAR RENDERINGU MARKDOWN */}
              <div className="p-8 lg:p-12 overflow-scroll">
                <article className="prose prose-slate prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-900 prose-li:text-slate-600 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {markdownResult}
                  </ReactMarkdown>
                </article>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default OfficialView;
