import { useState } from "react";
import FormSection from "@/components/form/FormSection";
import { formConfig } from "@/config/formConfig";
import { useFormSync } from "@/hooks/useFormSync";

function FormView() {
  const { localState, handleFieldChange, handleFieldBlur } =
    useFormSync(formConfig);

  // Stan do obsługi blokady przycisku podczas generowania
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      const sanitizePayload = (data: any) => {
        const cleaned = { ...data };

        // --- POPRAWKA BŁĘDU "list_type" ---
        // Sprawdź, czy witnesses to tablica. Jeśli jest to string "" lub null, ustaw pustą tablicę [].
        if (!Array.isArray(cleaned.witnesses)) {
          cleaned.witnesses = [];
        } else {
          // Opcjonalnie: Jeśli tablica istnieje, usuń pustych/niepełnych świadków
          cleaned.witnesses = cleaned.witnesses.filter(
            (w: any) => w.first_name && w.last_name
          );
        }

        // --- RESZTA PÓL ---
        // Zamień puste stringi "" na null dla pól typu Data, Enum itp.
        Object.keys(cleaned).forEach((key) => {
          // Pomijamy 'witnesses', bo obsłużyliśmy je wyżej
          if (key !== "witnesses" && cleaned[key] === "") {
            cleaned[key] = null;
          }
        });

        return cleaned;
      };

      // Używamy funkcji czyszczącej
      const payload = sanitizePayload(localState);

      const response = await fetch(
        "http://localhost:8000/api/case/download-documents",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        // Logowanie błędu, jeśli nadal występuje
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend error details:", errorData);
        throw new Error("Błąd walidacji danych (422)");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "dokumenty_wypadkowe.zip");
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Wystąpił błąd podczas generowania. Sprawdź konsolę.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-20 custom-scrollbar">
      {/* Sekcje formularza */}
      {formConfig.map((section, index) => (
        <FormSection
          key={index}
          config={section}
          values={localState}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
        />
      ))}

      {/* Sekcja przycisku pobierania */}
      <div className="mt-8 border-t pt-6 mb-10 flex justify-end">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all
            ${
              isDownloading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-95"
            }
          `}
        >
          {isDownloading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Generowanie...</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Pobierz dokumenty (ZIP)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default FormView;
