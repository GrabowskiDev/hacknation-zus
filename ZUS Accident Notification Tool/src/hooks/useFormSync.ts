import { useState, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { flattenFormConfig } from "@/utils/formHelpers";
import type { FormSectionConfig } from "@/types";

export const useFormSync = (formConfig: FormSectionConfig[]) => {
  const { caseState, setCaseState } = useChat();
  const [localState, setLocalState] = useState<Record<string, string>>({});

  // 1. Flatten config once to find fields easily by key
  const flatConfig = flattenFormConfig(formConfig);

  // 2. Sync Global Context -> Local State (When AI updates data)
  useEffect(() => {
    if (!caseState) return;

    const newLocalState = flatConfig.reduce((acc, field) => {
      const val = caseState[field.key];
      // Format data for display if needed (e.g. dates)
      acc[field.key] = field.format
        ? field.format(val)
        : val === undefined || val === null
        ? ""
        : String(val);
      return acc;
    }, {} as Record<string, string>);

    setLocalState(newLocalState);
  }, [caseState]);

  // 3. Handle Local Typing (Fast UI)
  const handleFieldChange = (key: string, newValue: string) => {
    setLocalState((prev) => ({ ...prev, [key]: newValue }));
  };

  // 4. Sync Local State -> Global Context (On Blur / Commit)
  const handleFieldBlur = (key: string, newValue: string) => {
    const field = flatConfig.find((f) => f.key === key);

    setCaseState((prev) => ({
      ...prev,
      // Parse strings back to numbers/dates if needed
      [key]: field?.parse ? field.parse(newValue) : newValue,
    }));
  };

  return {
    localState,
    handleFieldChange,
    handleFieldBlur,
  };
};
