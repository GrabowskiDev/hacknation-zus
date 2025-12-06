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
  const handleFieldValidBlur = async (
    sectionIndex: number,
    fieldIndex: number,
    newValue: string
  ) => {
    if (!formContent) return;
    const field = formContent.sections[sectionIndex].fields[fieldIndex];

    try {
      const response = await fetch("/api/assistant/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: "default_case",
          message: `Zaktualizowano pole "${field.label || field.name}" na wartość: "${newValue}"`,
          mode: "notification",
          conversation_history: [],
        }),
      });

      if (!response.ok) {
        console.error("Failed to send update to backend");
      }
    } catch (error) {
      console.error("Error sending update:", error);
    }
  };

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
          onFieldValidBlur={handleFieldValidBlur}
        />
      ))}
    </Box>
  );
}

export default ZusForm;
