import React from "react";
import { Paper, Typography, Box } from "@mui/material";
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
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {config.title}
      </Typography>
      <Box>
        {config.fields.map((field) => (
          <InputSection
            key={field.key}
            config={field}
            value={values[field.key] || ""}
            onChange={(newValue) => onFieldChange(field.key, newValue)}
            onBlur={(newValue) => onFieldBlur(field.key, newValue, field.label)}
          />
        ))}
      </Box>
    </Paper>
  );
}

export default FormSection;
