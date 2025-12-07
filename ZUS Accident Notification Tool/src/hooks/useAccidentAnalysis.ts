import { useState } from "react";
import type { ChangeEvent } from "react";

// Definicja typu odpowiedzi z backendu
interface BackendResponse {
  summary: string;
  file_count: number;
  accident_card_filled_text: string;
  accident_card_pdf_base64?: string | null; // To pole może być null
}

export const useAccidentAnalysis = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [markdownResult, setMarkdownResult] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Obsługa wyboru plików (DODAWANIE zamiast nadpisywania)
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Dodajemy nowe pliki do istniejących
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);

      // Resetujemy wyniki przy zmianie plików
      setMarkdownResult(null);
      setPdfData(null);
      setError(null);

      // Resetujemy input, aby można było wybrać ten sam plik ponownie po usunięciu
      e.target.value = "";
    }
  };

  // Nowa funkcja do usuwania pojedynczego pliku
  const removeFile = (indexToRemove: number) => {
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const downloadPdf = () => {
    if (!pdfData) return;

    try {
      // A. Dekodowanie Base64 do stringa binarnego
      const byteCharacters = atob(pdfData);

      // B. Konwersja na tablicę bajtów
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // C. Tworzenie Bloba (Binary Large Object)
      const blob = new Blob([byteArray], { type: "application/pdf" });

      // D. Tworzenie tymczasowego URL-a
      const url = window.URL.createObjectURL(blob);

      // E. Tworzenie niewidocznego linku i kliknięcie
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "karta_wypadku_draft.pdf"); // Nazwa pliku
      document.body.appendChild(link);
      link.click();

      // F. Sprzątanie
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Błąd podczas generowania pliku PDF", e);
      setError("Nie udało się pobrać pliku PDF.");
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
      if (data.accident_card_pdf_base64) {
        setPdfData(data.accident_card_pdf_base64);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Wystąpił błąd podczas łączenia z serwerem.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Dodatkowa pomocnicza funkcja do kopiowania tekstu
  const copyToClipboard = () => {
    if (markdownResult) {
      navigator.clipboard.writeText(markdownResult);
    }
  };

  return {
    files,
    isAnalyzing,
    markdownResult,
    error,
    handleFileChange,
    removeFile, // Eksportujemy nową funkcję
    handleAnalyze,
    copyToClipboard,
    hasPdf: !!pdfData,
    downloadPdf,
  };
};
