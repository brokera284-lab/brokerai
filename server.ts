import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with API Key
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// API Route for secure Gemini AI Lead Qualification Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, units, currencyCode, currencySymbol, exchangeRate } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const activeCurrency = currencyCode || "EGP";
    const activeSymbol = currencySymbol || "EGP";
    const rate = exchangeRate || 1;

    // Format units into a clean list for the prompt
    const unitsListStr = units && Array.isArray(units) && units.length > 0
      ? JSON.stringify(units.map(u => ({
          title: u.title,
          description: u.description,
          priceEGP: u.price,
          priceConverted: `${(u.price * rate).toLocaleString(undefined, { maximumFractionDigits: 1 })} ${activeSymbol}`,
          location: u.location,
          propertyType: u.propertyType,
          legalPaperStatus: u.legalPaperStatus
        })), null, 2)
      : "[]";

    if (!ai) {
      // Graceful fallback if API key is not configured yet
      const firstUnitTitle = units && units[0] ? units[0].title : "Glass Pavilion Villa";
      const firstUnitLoc = units && units[0] ? units[0].location : "Skyline District";
      const firstUnitType = units && units[0] ? units[0].propertyType : "Villa";
      const firstUnitPrice = units && units[0] ? `${(units[0].price * rate).toLocaleString()} ${activeSymbol}` : `1,500,000 ${activeSymbol}`;
      
      return res.json({
        response: `Hello! I am Broker AI. I scanned our registry and found some options for you! For example, our "${firstUnitTitle}" in "${firstUnitLoc}" (${firstUnitType}) is priced at ${firstUnitPrice}. (Please configure your GEMINI_API_KEY to activate my fully conversational intelligent matchmaker).`,
        qualification: "warm",
        extractedInfo: {
          budget: units && units[0] ? `${units[0].price} EGP` : "1.5M EGP",
          propertyType: firstUnitType,
          location: firstUnitLoc,
          legalPapersRequired: true
        }
      });
    }

    // Prepare system instructions for qualification & real properties matching
    const systemInstruction = `You are Broker AI, an elite real estate matchmaking and qualification agent.
Your primary mission is to help potential buyers find their dream properties from our actual database of uploaded units, while qualifying them as leads.

THE REAL PROPERTIES DATABASE OF UPLOADED UNITS:
${unitsListStr}

USER ENVIRONMENT SETTINGS:
- Local Currency Code: ${activeCurrency}
- Local Currency Symbol: ${activeSymbol}
- Exchange Rate relative to EGP: 1 EGP = ${rate} ${activeCurrency}

CRITICAL MATCHMAKING & QUALIFICATION RULES:
1. Always search the REAL PROPERTIES DATABASE above for matches when the user describes what they want.
2. Recommend specific properties that match or are close to their criteria. Mention their exact title, location, and price in both EGP and ${activeCurrency}! Highlight premium boosted status or legal paper verification.
3. If no units match their criteria or the database is empty, let them know what's available and ask questions to help narrow down what they'd buy. Do not invent properties that do not exist in the database!
4. Actively qualify the buyer. As the chat progresses, extract:
   - Target property type interest (e.g. villa, apartment, pavilion)
   - Budget (normalized to EGP, e.g. "1,500,000 EGP")
   - Preferred location (e.g. Skyline District, New Giza, etc.)
   - Legal paper status requirements.
5. Once they show clear purchase intent (e.g. expressing interest in contacting the owner, asking to visit/schedule, or specifying a serious matching budget), you MUST qualify them by setting "qualification" to:
   - "cold": Casual browser, vague requirements, low budget.
   - "warm": Moderate budget, interested, clear preferences but not ready to proceed immediately.
   - "hot": Ready to buy, highly interested in a specific listed unit, budget matches listed price.
6. When "qualification" is non-null, the system registers them as a lead in the broker's CRM.

You MUST respond ONLY in valid JSON format with the following schema:
{
  "response": "Your professional, conversational response. Address the user politely, list/describe matching properties, translate the prices to ${activeSymbol} for their convenience, and ask clarifying questions.",
  "qualification": null, // Use "cold", "warm", or "hot" ONLY when you qualify them. Otherwise leave as null.
  "extractedInfo": {
    "budget": "Extracted budget as a string with EGP currency (e.g., '3,000,000 EGP')",
    "propertyType": "Extracted property type",
    "location": "Extracted location",
    "legalPapersRequired": true/false/null
  }
}
Keep your response strictly JSON. Do not include markdown code block backticks (like \`\`\`json) or any extra characters around the JSON.`;

    // Format chat history for Gemini SDK
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const replyText = response.text || "{}";
    try {
      const parsedData = JSON.parse(replyText.trim());
      res.json(parsedData);
    } catch (parseError) {
      // Fallback if parsing fails
      res.json({
        response: replyText,
        qualification: null,
        extractedInfo: {}
      });
    }
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: error.message || "An error occurred during qualification." });
  }
});

// Vite Dev Server Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
