import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function pcmToWav(
  pcmBuffer: Buffer,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitDepth: number = 16
): Buffer {
  // Check if buffer already contains a valid RIFF/WAVE header
  if (
    pcmBuffer.length >= 12 &&
    pcmBuffer.toString("utf8", 0, 4) === "RIFF" &&
    pcmBuffer.toString("utf8", 8, 12) === "WAVE"
  ) {
    return pcmBuffer;
  }

  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write("WAVE", 8);

  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitDepth, 34);

  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

function isHighDemandError(err: any): boolean {
  if (!err) return false;
  const status = err.status || err.statusCode || err.code;
  if (status === 503 || status === 429) return true;
  const str = String(err.message || err);
  return (
    str.includes("503") ||
    str.includes("429") ||
    str.includes("UNAVAILABLE") ||
    str.includes("high demand") ||
    str.includes("Spikes in demand") ||
    str.includes("RESOURCE_EXHAUSTED")
  );
}

function parseGeminiErrorMessage(err: any): string {
  if (!err) return "An unexpected error occurred during synthesis.";
  const raw = String(err.message || err);
  try {
    const jsonMatch = raw.match(/\{[\s\S]*"error"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error?.message) {
        return parsed.error.message;
      }
    }
  } catch {
    // Ignore JSON parse error
  }
  if (isHighDemandError(err)) {
    return "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.";
  }
  return err.message || "Failed to generate speech with Gemini TTS.";
}

async function callWithRetry<T>(
  action: () => Promise<T>,
  retries: number = 3,
  baseDelayMs: number = 1200
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await action();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && isHighDemandError(err)) {
        const jitter = Math.floor(Math.random() * 600);
        const delay = baseDelayMs * Math.pow(1.8, attempt) + jitter;
        console.warn(
          `[Gemini TTS] Temporary demand spike (503/429). Retrying attempt ${
            attempt + 1
          }/${retries} in ${Math.round(delay)}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Shared Gemini client instance with telemetry header
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      model: "gemini-3.1-flash-tts-preview",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Voice catalog endpoint
  app.get("/api/voices", (_req, res) => {
    res.json({
      voices: [
        {
          name: "Kore",
          gender: "Female",
          tone: "Warm, soothing, clear",
          description: "Balanced and natural, ideal for audiobooks, guides, and conversational prompts.",
        },
        {
          name: "Puck",
          gender: "Male",
          tone: "Playful, energetic, friendly",
          description: "Lively and expressive, great for storytelling, animated characters, and casual tone.",
        },
        {
          name: "Charon",
          gender: "Male",
          tone: "Deep, resonant, authoritative",
          description: "Commanding and grounded, excellent for documentaries, announcements, and news.",
        },
        {
          name: "Fenrir",
          gender: "Male",
          tone: "Crisp, determined, dramatic",
          description: "Distinctive and intense, suited for dramatic narratives and trailers.",
        },
        {
          name: "Zephyr",
          gender: "Female",
          tone: "Gentle, airy, melodic",
          description: "Calm and peaceful, perfect for meditation, sleep stories, and poetic readings.",
        },
      ],
      styles: [
        { id: "natural", label: "Natural", promptPrefix: "" },
        { id: "cheerful", label: "Cheerful", promptPrefix: "Say cheerfully: " },
        { id: "calm", label: "Calm & Soothing", promptPrefix: "Read calmly and soothingly: " },
        { id: "dramatic", label: "Dramatic", promptPrefix: "Say dramatically with intensity: " },
        { id: "professional", label: "Professional", promptPrefix: "Announce professionally and clearly: " },
        { id: "whispering", label: "Whisper", promptPrefix: "Whisper softly: " },
      ],
    });
  });

  // Text-To-Speech generation endpoint using gemini-3.1-flash-tts-preview
  app.post("/api/tts", async (req, res) => {
    try {
      const {
        text,
        mode = "single",
        voice = "Kore",
        style = "natural",
        customPromptPrefix = "",
        speaker1Name = "Joe",
        speaker1Voice = "Kore",
        speaker2Name = "Jane",
        speaker2Voice = "Puck",
      } = req.body;

      if (!text || typeof text !== "string" || !text.trim()) {
        res.status(400).json({ error: "Text content is required." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error: "GEMINI_API_KEY is not configured in environment.",
        });
        return;
      }

      let promptText = text.trim();
      let speechConfigPayload: any = {};

      if (mode === "multi") {
        // Multi-speaker mode: 2 speakers
        promptText = `TTS the following conversation between ${speaker1Name} and ${speaker2Name}:\n${promptText}`;
        speechConfigPayload = {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: speaker1Name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: speaker1Voice || "Kore" },
                },
              },
              {
                speaker: speaker2Name,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: speaker2Voice || "Puck" },
                },
              },
            ],
          },
        };
      } else {
        // Single speaker mode
        let prefix = customPromptPrefix;
        if (!prefix) {
          switch (style) {
            case "cheerful":
              prefix = "Say cheerfully: ";
              break;
            case "calm":
              prefix = "Read calmly and soothingly: ";
              break;
            case "dramatic":
              prefix = "Say dramatically: ";
              break;
            case "professional":
              prefix = "Announce in a professional and clear tone: ";
              break;
            case "whispering":
              prefix = "Whisper softly: ";
              break;
            default:
              prefix = "";
          }
        }
        if (prefix) {
          promptText = `${prefix}${promptText}`;
        }

        speechConfigPayload = {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || "Kore" },
          },
        };
      }

      const response = await callWithRetry(
        () =>
          ai.models.generateContent({
            model: "gemini-3.1-flash-tts-preview",
            contents: [{ parts: [{ text: promptText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: speechConfigPayload,
            },
          }),
        3,
        1200
      );

      const part = response.candidates?.[0]?.content?.parts?.[0];
      const inlineData = part?.inlineData;

      if (!inlineData?.data) {
        // Fallback: check if text response was returned
        const textContent = response.text || "";
        res.status(502).json({
          error: "No audio stream returned by the TTS model.",
          details: textContent,
        });
        return;
      }

      const rawBuffer = Buffer.from(inlineData.data, "base64");
      // Format buffer as valid WAV file
      const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");
      const audioDataUrl = `data:audio/wav;base64,${wavBase64}`;
      const approxDurationSec = Math.max(0.1, rawBuffer.length / (24000 * 2));

      res.json({
        success: true,
        model: "gemini-3.1-flash-tts-preview",
        audioData: audioDataUrl,
        audioBase64: wavBase64,
        format: "audio/wav",
        sampleRate: 24000,
        estimatedDuration: approxDurationSec,
        mode,
        voice: mode === "single" ? voice : `${speaker1Name}(${speaker1Voice}) & ${speaker2Name}(${speaker2Voice})`,
        text: text.trim(),
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("TTS generation error:", error);
      const isDemandSpike = isHighDemandError(error);
      const friendlyMsg = parseGeminiErrorMessage(error);
      res.status(isDemandSpike ? 503 : 500).json({
        success: false,
        error: friendlyMsg,
        isHighDemand: isDemandSpike,
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
