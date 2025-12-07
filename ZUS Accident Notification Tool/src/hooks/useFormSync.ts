import { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { flattenFormConfig } from "@/utils/formHelpers";
import type { FormSectionConfig } from "@/types";

export const useFormSync = (formConfig: FormSectionConfig[]) => {
  // 1. Pobieramy updatePkd z Contextu (zakładam, że dodałeś to w poprzednim kroku)
  const { caseState, setCaseState, updatePkd } = useChat();
  const [localState, setLocalState] = useState<Record<string, string>>({});

  const flatConfig = flattenFormConfig(formConfig);

  // 2. Sync Global Context -> Local State
  useEffect(() => {
    if (!caseState) return;

    const newLocalState = flatConfig.reduce((acc, field) => {
      const val = caseState[field.key];
      acc[field.key] = field.format
        ? field.format(val)
        : val === undefined || val === null
        ? ""
        : String(val);
      return acc;
    }, {} as Record<string, string>);

    setLocalState(newLocalState);
  }, [caseState]); // Zależność tylko od caseState, config jest stały

  // 3. Handle Local Typing
  const handleFieldChange = (key: string, newValue: string) => {
    setLocalState((prev) => ({ ...prev, [key]: newValue }));
  };

  // 4. Sync Local State -> Global Context (TUTAJ JEST ZMIANA)
  const handleFieldBlur = (key: string, newValue: string) => {
    // --- SPECJALNA OBSŁUGA DLA KODU PKD ---
    // Sprawdź, czy klucz odpowiada kodowi PKD (dostosuj nazwę 'pkdCode' do swojego konfigu!)
    if (key === "pkd") {
      if (updatePkd) {
        // Używamy dedykowanej funkcji z Contextu, która:
        // a) ustawi kod, b) znajdzie opis, c) ustawi opis
        updatePkd(newValue);
        return; // Kończymy, nie robimy standardowego setCaseState
      }
    }
    // ---------------------------------------

    const field = flatConfig.find((f) => f.key === key);

    setCaseState((prev) => ({
      ...prev,
      [key]: field?.parse ? field.parse(newValue) : newValue,
    }));
  };

  return {
    localState,
    handleFieldChange,
    handleFieldBlur,
  };
};
