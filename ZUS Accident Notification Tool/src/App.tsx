import "./App.css";
import ConversationalForm from "./chat/ConversationalForm";

// @ts-ignore
import { theme } from "/theme";

import { ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import ZusForm from "./zus_form/ZusForm";
import { ChatProvider } from "./context/ChatContext";

function App() {
  return (
    <main className="px-8 gap-2 flex justify-center items-center h-screen lg:gap-8 lg:flex-row flex-col">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ChatProvider>
          <ConversationalForm />
          <ZusForm />
        </ChatProvider>
      </ThemeProvider>
    </main>
  );
}

export default App;
