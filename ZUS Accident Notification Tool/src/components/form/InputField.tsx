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

  // Sprawdzamy typy
  const isTextarea = config.type === "textarea";
  const isSelect = config.type === "select";

  // Wspólne style dla wszystkich pól (żeby select wyglądał tak samo jak input)
  const baseStyles = `
    w-full px-4 py-3 rounded-xl bg-slate-50 border outline-none transition-all duration-200
    ${
      error
        ? "border-red-300 bg-red-50 focus:border-red-500 text-red-900"
        : "border-slate-200 hover:border-slate-300 focus:border-[#007834] focus:ring-1 focus:ring-[#007834] text-slate-800"
    }
  `;

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
        {isTextarea ? (
          <textarea
            id={inputId}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={config.placeholder}
            rows={3}
            className={`${baseStyles} resize-none`}
          />
        ) : isSelect ? (
          /* --- OBSŁUGA SELECT --- */
          <div className="relative">
            <select
              id={inputId}
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              className={`${baseStyles} appearance-none cursor-pointer pr-10`}
            >
              <option value="" disabled>
                {config.placeholder || "Wybierz opcję..."}
              </option>
              {config.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Ikona strzałki (aby select wyglądał ładnie) */}
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        ) : (
          /* --- OBSŁUGA INPUT (Text, Date, Time) --- */
          <input
            id={inputId}
            type={config.type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder={config.placeholder}
            className={baseStyles}
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
