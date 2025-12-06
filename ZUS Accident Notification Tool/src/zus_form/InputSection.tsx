import React, { useState } from "react";
import type { FormFieldConfig } from "../types";

interface InputSectionProps {
  config: FormFieldConfig;
  value: string;
  onChange: (newValue: string) => void;
  onBlur: (newValue: string) => void;
}

function InputSection({ config, value, onChange, onBlur }: InputSectionProps) {
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const validate = (val: string) => {
    if (config.regex) {
      return config.regex.test(val);
    }
    return true;
  };

  const handleBlur = () => {
    setIsFocused(false);
    const isValid = validate(value);
    setError(!isValid);
    if (isValid) {
      onBlur(value);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (error) {
      if (validate(newValue)) {
        setError(false);
      }
    }
  };

  const isMultiline = config.type === "textarea";
  const inputId = `field-${config.key}`;

  return (
    <div className="mb-5 group">
      <label
        htmlFor={inputId}
        className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 transition-colors duration-200
          ${
            error
              ? "text-red-600"
              : isFocused
              ? "text-[#007834]"
              : "text-slate-500"
          }`}
      >
        {config.label}
      </label>

      <div className="relative">
        {isMultiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            placeholder={config.placeholder}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all duration-200 resize-none
              ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900 placeholder:text-red-300"
                  : "border-slate-200 hover:border-slate-300 focus:border-[#007834] focus:ring-1 focus:ring-[#007834] text-slate-800"
              }`}
          />
        ) : (
          <input
            id={inputId}
            type={
              config.type === "date" || config.type === "time"
                ? config.type
                : "text"
            }
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            placeholder={config.placeholder}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all duration-200
              ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900 placeholder:text-red-300"
                  : "border-slate-200 hover:border-slate-300 focus:border-[#007834] focus:ring-1 focus:ring-[#007834] text-slate-800"
              }`}
          />
        )}
      </div>

      <div className="h-5 mt-1">
        {error && (
          <span className="text-xs text-red-500 font-medium animate-pulse">
            Nieprawidłowy format
          </span>
        )}
      </div>
    </div>
  );
}

export default InputSection;
