import { useState } from "react";
import type { FormFieldConfig } from "@/types";
import { validateField } from "@/utils/validation";

export const useInputLogic = (
  config: FormFieldConfig,
  value: string,
  onChange: (val: string) => void,
  onBlur: (val: string) => void
) => {
  const [error, setError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleBlur = () => {
    setIsFocused(false);
    const isValid = validateField(value, config.regex);
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
