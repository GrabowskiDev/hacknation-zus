import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Container,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import TextMessage from "./TextMessage";
import { useChat } from "../context/ChatContext"; // 1. Importujemy hook contextu

function ConversationalForm() {
  // 2. Pobieramy stan i funkcje z Contextu zamiast lokalnych useState
  const { messages, sendMessage, isLoading } = useChat();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll do dołu przy każdej nowej wiadomości lub zmianie statusu ładowania
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const messageToSend = input;
    setInput(""); // Czyścimy input natychmiast dla lepszego UX

    // 3. Wysyłamy wiadomość do Contextu (który gada z API)
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <Container
      maxWidth="sm" // W kontekście layoutu gridowego można to zmienić na false/xl zależnie od potrzeb
      disableGutters // Opcjonalnie, żeby lepiej pasowało w kolumnie
      sx={{ py: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Paper
        elevation={4}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 4,
          position: "relative",
        }}
      >
        {/* --- Pasek Nagłówka --- */}
        <Box sx={{ bgcolor: "primary.main", color: "white", p: 2 }}>
          <Typography variant="h6" align="center">
            Asystent Zgłoszenia
          </Typography>
        </Box>

        {/* --- Obszar Czatu --- */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 3,
            bgcolor: "#f8f9fa",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {/* 4. Mapujemy wiadomości z Contextu */}
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <TextMessage
                key={index} // W produkcji najlepiej używać unikalnego ID z backendu
                text={msg.content}
                isUser={isUser}
              />
            );
          })}

          {/* Animacja ładowania (zamiast "Pisanie...") */}
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                ml: 1,
                mt: 1,
              }}
            >
              <CircularProgress size={20} color="secondary" />
              <Typography
                variant="caption"
                sx={{ color: "grey.500", fontStyle: "italic" }}
              >
                Analizuję odpowiedź...
              </Typography>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* --- Obszar Inputu --- */}
        <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #eee" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Opisz sytuację..."
              variant="outlined"
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading} // Blokada inputu podczas komunikacji z API
              autoComplete="off"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{
                bgcolor: "primary.50",
                "&:hover": { bgcolor: "primary.100" },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default ConversationalForm;
