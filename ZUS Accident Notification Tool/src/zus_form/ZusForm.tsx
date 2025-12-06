import { useEffect, useState } from "react";
import FormSection from "./FormSection";
import { useChat } from "../context/ChatContext";
import { formConfig } from "./formConfig";

// Flatten config for easier access
const flatConfig = formConfig.flatMap((section) => section.fields);

function ZusForm() {
  const { caseState, setCaseState } = useChat();
  const [localState, setLocalState] = useState<Record<string, string>>({});

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
  }, [caseState]);

  const handleFieldChange = (key: string, newValue: string) => {
    setLocalState((prev) => ({ ...prev, [key]: newValue }));
  };

  const handleFieldBlur = (key: string, newValue: string) => {
    const field = flatConfig.find((f) => f.key === key);

    setCaseState((prev) => ({
      ...prev,
      [key]: field?.parse ? field.parse(newValue) : newValue,
    }));
  };

  return (
    <div className="h-full overflow-y-auto px-6 pb-20 custom-scrollbar">
      {formConfig.map((section, index) => (
        <FormSection
          key={index}
          config={section}
          values={localState}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
        />
      ))}
    </div>
  );
}

export default ZusForm;
