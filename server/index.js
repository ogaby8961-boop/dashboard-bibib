import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import { google } from "googleapis";

dotenv.config();

const app = express();
const port = Number(process.env.BACKEND_PORT || 8787);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "bibly-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", secure: false },
  })
);

app.get("/api/connect/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(url);
});

app.get("/api/oauth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Codigo OAuth ausente.");

  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.googleTokens = tokens;
    res.redirect(`${frontendOrigin}/?google_connected=1`);
  } catch (error) {
    res.status(500).send("Falha ao concluir conexao com Google.");
  }
});

app.post("/api/connect/google/disconnect", (req, res) => {
  req.session.googleTokens = null;
  res.json({ ok: true });
});

app.get("/api/connectors/status", async (req, res) => {
  const googleConnected = Boolean(req.session.googleTokens?.access_token || req.session.googleTokens?.refresh_token);
  res.json({
    googleAgenda: googleConnected ? "conectado" : "disponivel",
    googleSheets: "disponivel",
    slack: "disponivel",
    gmail: "disponivel",
  });
});

app.get("/api/google/calendar/events", async (req, res) => {
  if (!req.session.googleTokens) {
    return res.status(401).json({ error: "Google Agenda nao conectada." });
  }

  try {
    oauth2Client.setCredentials(req.session.googleTokens);
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: "primary",
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
      timeMin: new Date().toISOString(),
    });
    res.json({ events: response.data.items || [] });
  } catch (error) {
    res.status(500).json({ error: "Falha ao buscar eventos do calendario." });
  }
});

app.post("/api/chat/message", async (req, res) => {
  const { system, messages } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor." });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system, messages }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Falha ao contatar a API da Anthropic." });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Bibly backend rodando em http://localhost:${port}`);
});

