import React, { useState } from "react";
import { TextField, Box } from "@mui/material";
import type { FieldInterface } from "./Interfaces";

interface InputSectionProps {
  field: FieldInterface;
  onChange: (newValue: string) => void;
  onValidBlur: (newValue: string) => void;
}

function InputSection({ field, onChange, onValidBlur }: InputSectionProps) {
  const [error, setError] = useState(false);

  const handleBlur = () => {
    if (field.regex) {
      const isValid = field.regex.test(field.currentValue);
      setError(!isValid);
      if (isValid) {
        onValidBlur(field.currentValue);
      }
    } else {
      onValidBlur(field.currentValue);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label={field.label || field.name}
        value={field.currentValue || ""}
        placeholder={field.formatPlaceholder}
        variant="outlined"
        error={error}
        helperText={error ? "Nieprawidłowy format" : field.formatPlaceholder}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError(false);
        }}
        onBlur={handleBlur}
      />
    </Box>
  );
}

export default InputSection;
