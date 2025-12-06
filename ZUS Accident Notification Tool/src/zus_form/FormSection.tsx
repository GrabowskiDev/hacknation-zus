import React from "react";
import type { FormSectionConfig } from "../types";
import InputSection from "./InputSection";

interface FormSectionProps {
  config: FormSectionConfig;
  values: Record<string, string>;
  onFieldChange: (key: string, newValue: string) => void;
  onFieldBlur: (key: string, newValue: string, label: string) => void;
}

function FormSection({
  config,
  values,
  onFieldChange,
  onFieldBlur,
}: FormSectionProps) {
  return (
    <div className="mb-8 last:mb-0">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-6 w-1 bg-[#007834] rounded-full"></div>
        <h3 className="text-lg font-bold text-slate-800">{config.title}</h3>
      </div>

      <div className="bg-white p-1">
        {config.fields.map((field) => (
          <InputSection
            key={field.key}
            config={field}
            value={values[field.key] || ""}
            onChange={(newValue) => onFieldChange(field.key, newValue)}
            onBlur={(newValue) => onFieldBlur(field.key, newValue, field.label)}
          />
        ))}
      </div>

      {/* Visual separator */}
      <hr className="border-t border-slate-100 mt-2" />
    </div>
  );
}

export default FormSection;
