import React from "react";
import { Box, Paper, Typography, Avatar } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";

interface TextMessageProps {
  text: string;
  isUser: boolean;
}

const TextMessage: React.FC<TextMessageProps> = ({ text, isUser }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        mb: 2, // Odstęp między wiadomościami
        gap: 1,
      }}
    >
      {/* 1. Avatar Bota (widoczny tylko jeśli to NIE user) */}
      {!isUser && (
        <Avatar
          sx={{
            bgcolor: "secondary.main",
            width: 32,
            height: 32,
          }}
        >
          <SmartToyIcon fontSize="small" />
        </Avatar>
      )}

      {/* 2. Dymek wiadomości */}
      <Paper
        elevation={isUser ? 1 : 2} // Lekki cień dla bota, mniejszy dla usera
        sx={{
          p: 2,
          maxWidth: "75%",
          borderRadius: 4,

          // Logika kolorów
          bgcolor: isUser ? "primary.main" : "background.paper",
          color: isUser ? "primary.contrastText" : "text.primary",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            whiteSpace: "pre-line", // Obsługa nowych linii w tekście
            wordBreak: "break-word", // Zabezpieczenie przed bardzo długimi słowami
          }}
        >
          {text}
        </Typography>
      </Paper>

      {/* 3. Avatar Usera (widoczny tylko jeśli to user) */}
      {isUser && (
        <Avatar
          sx={{
            bgcolor: "grey.400",
            width: 32,
            height: 32,
          }}
        >
          <PersonIcon fontSize="small" />
        </Avatar>
      )}
    </Box>
  );
};

export default TextMessage;
