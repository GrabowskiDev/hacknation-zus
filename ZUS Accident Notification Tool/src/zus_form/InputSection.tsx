import React, { useState } from "react";
import { TextField, Box } from "@mui/material";
import type { FieldInterface } from "./Interfaces";

interface InputSectionProps {
  field: FieldInterface;
  onChange: (newValue: string) => void;
  onValidBlur: (newValue: string) => void;
}

function InputSection({ field, onChange, onValidBlur }: InputSectionProps) {
  const [error, setError] = useState(() => {
    if (field.regex && field.currentValue) {
      return !field.regex.test(field.currentValue);
    }
    return false;
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (error && field.regex) {
      setError(!field.regex.test(newValue));
    }
  };

  const isMultiline = field.inputType === "textarea" || field.inputType === "text";
  const isTextarea = field.inputType === "textarea";

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
        onChange={handleChange}
        onBlur={handleBlur}
        multiline={isMultiline}
        minRows={isTextarea ? 3 : 1}
        sx={{
          "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d32f2f", // Standard MUI error red
            borderWidth: "2px",
          },
          "& .MuiFormHelperText-root.Mui-error": {
            color: "#d32f2f",
          },
        }}
      />
    </Box>
  );
}

export default InputSection;
