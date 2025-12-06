import "./App.css";
import ConversationalForm from "./chat/ConversationalForm";

// @ts-ignore
import { theme } from "/theme";

import { useState } from "react";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import { mockFormData as zusMockFormData } from "./zus_form/mockData";
import ZusForm from "./zus_form/ZusForm";
import type { FormInterface } from "./zus_form/Interfaces";
import { ChatProvider } from "./context/ChatContext";

function App() {
  const [formData, setFormData] = useState<FormInterface | null>(
    zusMockFormData
  );

  const handleFieldChange = (
    sectionIndex: number,
    fieldIndex: number,
    newValue: string
  ) => {
    if (!formData) return;

    const newFormData = { ...formData };
    newFormData.sections[sectionIndex].fields[fieldIndex].currentValue =
      newValue;
    setFormData(newFormData);
  };

  return (
    <main className="flex justify-center items-center h-screen">
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ChatProvider>
            <ConversationalForm />
            <ZusForm formContent={formData} onFieldChange={handleFieldChange} />
          </ChatProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </main>
  );
}

export default App;
