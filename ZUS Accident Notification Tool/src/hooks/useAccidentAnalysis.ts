import { useState } from "react";
import type { ChangeEvent } from "react";
// Definicja typu odpowiedzi z backendu
interface BackendResponse {
  summary: string;
  file_count: number;
}

export const useAccidentAnalysis = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [markdownResult, setMarkdownResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Obsługa wyboru plików
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setMarkdownResult(null);
      setError(null);
    }
  };

  // Logika wysyłki i analizy
  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setIsAnalyzing(true);
    setError(null);
    setMarkdownResult(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch(
        "http://localhost:8000/api/ocr/summarize-accident-facts",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Błąd podczas analizy");
      }

      const data: BackendResponse = await response.json();
      setMarkdownResult(data.summary);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Wystąpił błąd podczas łączenia z serwerem.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dodatkowa pomocnicza funkcja do kopiowania tekstu (opcjonalnie)
  const copyToClipboard = () => {
    if (markdownResult) {
      navigator.clipboard.writeText(markdownResult);
      // Tu można dodać np. toast z powiadomieniem
    }
  };

  return {
    files,
    isAnalyzing,
    markdownResult,
    error,
    handleFileChange,
    handleAnalyze,
    copyToClipboard,
  };
};
