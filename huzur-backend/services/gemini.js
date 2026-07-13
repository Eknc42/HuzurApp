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

First answer using the provided context.

If the context is incomplete,
you MAY complete the answer using your own knowledge.

Clearly distinguish between:

1. Information from the knowledge base.

2. Information from your general knowledge.

Never invent Qur'an verses.

Never invent Hadith.

Always mention the provided sources.

CONTEXT:

${context}

QUESTION:

${question}
`;

  }

  //-------------------------------------------------
  // GENERAL MODE
  //-------------------------------------------------

  else {

    prompt = `
You are Huzur AI.

The knowledge base does not contain enough information.

Answer using your own knowledge.

Do NOT fabricate Qur'an verses.

Do NOT fabricate Hadith.

If you are unsure about a narration,
say that you are unsure.

At the beginning write exactly:

⚠️ Bu cevap doğrulanmış bilgi tabanından değil, yapay zekanın genel bilgisinden üretilmiştir.

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
