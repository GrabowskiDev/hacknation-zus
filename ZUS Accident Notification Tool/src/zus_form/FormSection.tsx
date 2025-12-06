import React from "react";
import { Paper, Typography, Box } from "@mui/material";
import type { FormSectionInterface } from "./Interfaces";
import InputSection from "./InputSection";

interface FormSectionProps {
  section: FormSectionInterface;
  sectionIndex: number;
  onFieldChange: (
    sectionIndex: number,
    fieldIndex: number,
    newValue: string
  ) => void;
}

function FormSection({
  section,
  sectionIndex,
  onFieldChange,
}: FormSectionProps) {
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {section.title}
      </Typography>
      <Box>
        {section.fields.map((field, index) => (
          <InputSection
            key={index}
            field={field}
            onChange={(newValue) =>
              onFieldChange(sectionIndex, index, newValue)
            }
          />
        ))}
      </Box>
    </Paper>
  );
}

export default FormSection;
