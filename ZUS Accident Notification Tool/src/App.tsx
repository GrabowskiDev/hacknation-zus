import "./App.css";
import ConversationalForm from "./chat/ConversationalForm";

// @ts-ignore
import { theme } from "/theme";

import { ThemeProvider } from "@emotion/react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import zusMockFormData from "./zus_form/mockData";
import ZusForm from "./zus_form/ZusForm";

function App() {
  return (
    <main className="flex justify-center items-center h-screen">
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ConversationalForm />
          <ConversationalForm />
          <ZusForm formContent={zusMockFormData} />
        </ThemeProvider>
      </StyledEngineProvider>
    </main>
  );
}

export default App;
