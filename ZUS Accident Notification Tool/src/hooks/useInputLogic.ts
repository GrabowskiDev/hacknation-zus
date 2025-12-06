import { useState } from "react";
import type { ChangeEvent, FocusEvent } from "react";
import type { FormFieldConfig } from "@/types";
import { validateField } from "@/utils/validation";

// Definiujemy unię typów, aby obsłużyć Input, Textarea oraz Select
type FormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export const useInputLogic = (
  config: FormFieldConfig,
  value: string,
  onChange: (val: string) => void,
  onBlur: (val: string) => void
) => {
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Dodajemy typowanie zdarzenia FocusEvent<FormElement>
  const handleBlur = (e?: FocusEvent<FormElement>) => {
    setIsFocused(false);
    const isValid = validateField(value, config.regex);
    setError(!isValid);
    if (isValid) {
      onBlur(value);
    }
  };

  // Kluczowa poprawka: ChangeEvent<FormElement> obsługuje teraz selecta
  const handleChange = (e: ChangeEvent<FormElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // UX: Auto-clear error if user fixes it while typing
    if (error) {
      if (validateField(newValue, config.regex)) {
        setError(false);
      }
    }
  };

  const handleFocus = () => setIsFocused(true);

  return {
    error,
    isFocused,
    handleBlur,
    handleChange,
    handleFocus,
  };
};
