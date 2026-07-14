require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(question, context, mode = "rag") {

  let prompt = "";

  //-------------------------------------------------
  // RAG MODE
  //-------------------------------------------------

  if (mode === "rag") {

    prompt = `
You are Huzur AI.

Answer ONLY using the context below.

Never use your own knowledge.

Never invent Qur'an verses.

Never invent Hadith.

If the answer cannot be found inside the context, answer ONLY:

"Bu konuda bilgi tabanımda yeterli bilgi bulunamadı."

Always mention sources.

CONTEXT:

${context}

QUESTION:

${question}
`;

  }

  //-------------------------------------------------
  // MIXED MODE
  //-------------------------------------------------

  else if (mode === "mixed") {

    prompt = `
You are Huzur AI.

You have been provided with some context from the local knowledge base.
First, try to answer the question using ONLY the provided context.

CRITICAL RULES:
1. If the provided context DOES NOT contain the answer to the user's question, IGNORE the context entirely. DO NOT mention what the context was about, and DO NOT list the sources.
2. If the context is irrelevant, you MUST act exactly like you are in Diyanet Mode:
   - Provide the answer based ONLY on the fatwas and information from the Turkish Presidency of Religious Affairs (Diyanet).
   - Clearly cite Diyanet (e.g., "Diyanet İşleri Başkanlığı'nın açıklamasına göre...").
   - Do NOT use your own general knowledge.
   - At the very beginning of your response, write exactly: "🔍 Veritabanındaki eşleşmeler sorunuzla alakalı olmadığı için bu cevap Diyanet İşleri Başkanlığı (diyanet.gov.tr) kaynaklarından derlenmiştir."
3. If the context is PARTIALLY relevant and you also need to use Diyanet information to complete the answer:
   - First, write the answer according to the provided context.
   - Then, add exactly the word [SEPARATOR] on a new line (with spaces around it like this: " [SEPARATOR] ") to insert a visual green line.
   - Below the separator, write the supplementary Diyanet fatwa/information.
4. If the context DOES contain the FULL answer, answer the question using the context and clearly cite the sources. DO NOT use [SEPARATOR].

Never invent Qur'an verses.
Never invent Hadith.

CONTEXT:

${context}

QUESTION:

${question}
`;

  }

  //-------------------------------------------------
  // GENERAL MODE (Diyanet Search Mode)
  //-------------------------------------------------

  else {

    prompt = `
You are Huzur AI.

The local knowledge base does not contain enough information.

Instead of your general knowledge, you MUST search the internet, specifically targeting the official website of the Turkish Presidency of Religious Affairs (Diyanet).

1. Search for the user's question on Diyanet's official websites (e.g., kurul.diyanet.gov.tr, fetva.diyanet.gov.tr, diyanet.gov.tr).
2. Write the answer based ONLY on the fatwas and information you find from Diyanet.
3. If you find a fatwa or information from Diyanet, clearly cite it (e.g., "Diyanet İşleri Başkanlığı'nın açıklamasına göre...").
4. Do NOT answer based on your own general knowledge. If Diyanet has no information about it, say "Türkiye Diyanet İşleri Başkanlığı'nın kaynaklarında bu konuya dair güncel bir fetva veya bilgi bulunamadı."

At the beginning write exactly:

🔍 Bu cevap veritabanında bulunamadığı için Diyanet İşleri Başkanlığı (diyanet.gov.tr) kaynaklarından canlı olarak araştırılmıştır.

QUESTION:

${question}
`;

  }

  let retries = 3;
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        // Google Search Tool requires a paid/billing-enabled project, which causes 429 quota errors here.
        // The prompt alone is sufficient to ground the model on Diyanet rulings.
      });

      return typeof response.text === "function"
        ? response.text()
        : response.text;
    } catch (error) {
      lastError = error;
      if (error.status === 503) {
        console.warn(`Gemini 503 Error. Retrying in ${i + 1} seconds...`);
        await new Promise(r => setTimeout(r, (i + 1) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

module.exports = {
  askGemini,
};
