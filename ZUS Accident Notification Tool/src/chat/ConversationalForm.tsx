import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Avatar,
  Container,
  LinearProgress,
  Button,
  Card,
  CardContent,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TextMessage from "./TextMessage";

// 1. Definicja kroków formularza
const FORM_STEPS = [
  {
    key: "firstName",
    question: "Cześć! Jestem Twoim wirtualnym asystentem. Jak masz na imię?",
  },
  {
    key: "email",
    question: "Miło Cię poznać! Podaj proszę swój adres e-mail.",
  },
  {
    key: "role",
    question:
      "Dzięki. Jakie stanowisko Cię interesuje (np. Frontend, Backend)?",
  },
  { key: "experience", question: "Ile lat masz doświadczenia komercyjnego?" },
];

function ConversationalForm() {
  // --- Stan Aplikacji ---
  const [stepIndex, setStepIndex] = useState(0); // Który krok (pytanie) obecnie
  const [formData, setFormData] = useState({}); // Zebrane dane
  const [history, setHistory] = useState([
    // Historia czatu
    { id: 0, text: FORM_STEPS[0].question, sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Blokada inputa gdy bot "myśli"

  const messagesEndRef = useRef(null);

  // Auto-scroll do dołu
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isTyping]);

  // Obliczanie postępu (0 - 100%)
  const progress = Math.min((stepIndex / FORM_STEPS.length) * 100, 100);
  const isFinished = stepIndex >= FORM_STEPS.length;

  const handleSend = () => {
    if (!input.trim() || isFinished) return;

    // 1. Dodaj odpowiedź użytkownika do historii
    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setHistory((prev) => [...prev, userMsg]);

    // 2. Zapisz dane do obiektu formData
    const currentStepKey = FORM_STEPS[stepIndex].key;
    setFormData((prev) => ({ ...prev, [currentStepKey]: input }));

    setInput("");
    setIsTyping(true); // Włącz symulację myślenia

    // 3. Przejście do następnego kroku z opóźnieniem
    setTimeout(() => {
      const nextStep = stepIndex + 1;

      if (nextStep < FORM_STEPS.length) {
        // Mamy kolejne pytanie
        const botMsg = {
          id: Date.now() + 1,
          text: FORM_STEPS[nextStep].question,
          sender: "bot",
        };
        setHistory((prev) => [...prev, botMsg]);
        setStepIndex(nextStep);
      } else {
        // Koniec formularza
        const finalMsg = {
          id: Date.now() + 1,
          text: "Dziękuję! Zebrałem wszystkie potrzebne informacje. Poniżej podsumowanie.",
          sender: "bot",
        };
        setHistory((prev) => [...prev, finalMsg]);
        setStepIndex(nextStep); // Ustawia flagę isFinished
      }

      setIsTyping(false);
    }, 1000); // 1 sekunda opóźnienia dla naturalności
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <Container
      maxWidth="sm"
      sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}
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
        {/* --- Pasek Nagłówka i Postępu --- */}
        <Box sx={{ bgcolor: "primary.main", color: "white", p: 2 }}>
          <Typography variant="h6" align="center">
            Zgłoszenie Wypadku
          </Typography>
          {/* <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                flexGrow: 1,
                height: 8,
                borderRadius: 4,
                bgcolor: "primary.dark",
                "& .MuiLinearProgress-bar": { bgcolor: "#90caf9" },
              }}
            />
            <Typography variant="caption">{Math.round(progress)}%</Typography>
          </Box> */}
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
          {history.map((msg) => {
            const isUser = msg.sender === "user";
            return <TextMessage key={msg.id} text={msg.text} isUser={isUser} />;
          })}

          {/* Animacja kropek gdy bot pisze */}
          {isTyping && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: "grey.500", fontStyle: "italic" }}
              >
                Pisanie...
              </Typography>
            </Box>
          )}

          {/* Podsumowanie na koniec */}
          {isFinished && (
            <Card
              variant="outlined"
              sx={{ mt: 2, borderColor: "success.main", bgcolor: "#f1f8e9" }}
            >
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6" color="success.main">
                    Formularz Ukończony
                  </Typography>
                </Box>
                <pre style={{ fontSize: "0.85rem", color: "#555" }}>
                  {JSON.stringify(formData, null, 2)}
                </pre>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  sx={{ mt: 2 }}
                >
                  Wyślij Zgłoszenie
                </Button>
              </CardContent>
            </Card>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* --- Obszar Inputu --- */}
        <Box sx={{ p: 2, bgcolor: "white", borderTop: "1px solid #eee" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              placeholder={isFinished ? "Zakończono" : "Wpisz odpowiedź..."}
              variant="outlined"
              size="small"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isTyping || isFinished} // Blokada inputu
              autoComplete="off"
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || isFinished}
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
