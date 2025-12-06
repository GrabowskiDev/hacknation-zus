import type { FormFieldConfig } from "@/types";
import { useInputLogic } from "@/hooks/useInputLogic";

interface InputFieldProps {
  config: FormFieldConfig;
  value: string;
  onChange: (newValue: string) => void;
  onBlur: (newValue: string) => void;
}

function InputField({ config, value, onChange, onBlur }: InputFieldProps) {
  const { error, isFocused, handleBlur, handleChange, handleFocus } =
    useInputLogic(config, value, onChange, onBlur);

  const inputId = `field-${config.key}`;
  const isMultiline = config.type === "textarea";

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
            onFocus={handleFocus}
            placeholder={config.placeholder}
            rows={3}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all duration-200 resize-none
              ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900"
                  : "border-slate-200 hover:border-slate-300 focus:border-[#007834] focus:ring-1 focus:ring-[#007834] text-slate-800"
              }`}
          />
        ) : (
          <input
            id={inputId}
            type={config.type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={config.placeholder}
            className={`w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all duration-200
              ${
                error
                  ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900"
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

export default InputField;
