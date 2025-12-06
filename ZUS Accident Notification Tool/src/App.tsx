import "./App.css";
import ConversationalForm from "./chat/ConversationalForm";

// @ts-ignore
import { theme } from "/theme";

import { ThemeProvider } from "@emotion/react";
import { CssBaseline, StyledEngineProvider } from "@mui/material";
import ZusForm from "./zus_form/ZusForm";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <main className="flex justify-center items-center h-screen gap-8">
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ChatProvider>
            <ConversationalForm />
            <ZusForm />
          </ChatProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </main>
  );
}

export default App;
