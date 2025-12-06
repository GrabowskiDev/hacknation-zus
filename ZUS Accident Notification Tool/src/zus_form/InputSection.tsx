import React, { useState } from "react";
import { TextField, Box } from "@mui/material";
import type { FormFieldConfig } from "../types";

interface InputSectionProps {
  config: FormFieldConfig;
  value: string;
  onChange: (newValue: string) => void;
  onBlur: (newValue: string) => void;
}

function InputSection({ config, value, onChange, onBlur }: InputSectionProps) {
  const [error, setError] = useState(false);

  const validate = (val: string) => {
      if (config.regex) {
          return config.regex.test(val);
      }
      return true;
  };

  const handleBlur = () => {
    const isValid = validate(value);
    setError(!isValid);
    if (isValid) {
      onBlur(value);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (error) {
        if (validate(newValue)) {
            setError(false);
        }
    }
  };

  const isMultiline = config.type === "textarea";

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label={config.label}
        value={value}
        placeholder={config.placeholder}
        variant="outlined"
        error={error}
        helperText={error ? "Nieprawidłowy format" : config.placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        multiline={isMultiline}
        minRows={isMultiline ? 3 : 1}
        type={config.type === "date" || config.type === "time" ? config.type : "text"}
        InputLabelProps={
            (config.type === "date" || config.type === "time") ? { shrink: true } : undefined
        }
        sx={{
          "& .MuiOutlinedInput-root.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d32f2f",
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
