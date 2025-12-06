import { Box, Typography } from "@mui/material";
import type { FormInterface } from "./Interfaces";
import FormSection from "./FormSection";

interface ZusFormProps {
  formContent: FormInterface | null;
  onFieldChange: (
    sectionIndex: number,
    fieldIndex: number,
    newValue: string
  ) => void;
}

function ZusForm({ formContent, onFieldChange }: ZusFormProps) {
  if (!formContent || !formContent.sections) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1" color="text.secondary">
          Formularz jest pusty. Rozpocznij rozmowę, aby go wypełnić.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%", overflowY: "auto", p: 2 }}>
      {formContent.sections.map((section, index) => (
        <FormSection
          key={index}
          section={section}
          sectionIndex={index}
          onFieldChange={onFieldChange}
        />
      ))}
    </Box>
  );
}

export default ZusForm;
