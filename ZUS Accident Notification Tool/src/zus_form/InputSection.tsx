import React from "react";
import { TextField, Box } from "@mui/material";
import type { FieldInterface } from "./Interfaces";

interface InputSectionProps {
  field: FieldInterface;
  onChange: (newValue: string) => void;
}

function InputSection({ field, onChange }: InputSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        fullWidth
        label={field.label || field.name}
        value={field.currentValue || ""}
        placeholder={field.formatPlaceholder}
        variant="outlined"
        onChange={(e) => onChange(e.target.value)}
        helperText={field.formatPlaceholder}
      />
    </Box>
  );
}

export default InputSection;
