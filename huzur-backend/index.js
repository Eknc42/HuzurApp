const express = require('express');
const cors = require('cors');
const { hybridSearch } = require('./hybridSearch');
const { askGemini } = require('./services/gemini');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ success: false, error: 'Question is required' });
  }

  try {
    const { results, bestScore } = await hybridSearch(question);
    
    let mode = results.length > 0 ? "mixed" : "general";
    let context = "";

    // Eğer en iyi skor çok düşükse, alakasız sonuçlar gelmiş demektir
    if (bestScore < 0.05) {
      mode = "general";
      context = "";
    }

    results.forEach((item) => {
      context += `Kaynak:\n${item.citation || item.title}\n\n${item.content}\n\n----------------------------------------\n`;
    });

    if (mode === "general") {
      context = "";
    }

    const answer = await askGemini(question, context, mode);

    let sources = results.map(item => ({
      title: item.title,
      citation: item.citation || item.title,
      type: item.type
    }));

    if (mode === "general" || answer.includes("🔍")) {
      sources = [{
        title: "Diyanet İşleri Başkanlığı",
        citation: "Fetva ve Kaynaklar (diyanet.gov.tr)",
        type: "web_search"
      }];
    }

    return res.json({
      success: true,
      answer,
      bestScore,
      sources
    });
  } catch (error) {
    console.error('API Error:', error);
    
    let errorMessage = 'Sunucu tarafında bir hata oluştu.';
    if (error.status === 429) {
      errorMessage = 'Arka arkaya çok fazla soru sorduğunuz için sistem geçici olarak yavaşlatıldı. Lütfen 1 dakika bekleyip tekrar deneyin. (Hata Kaynağı: ' + (error.name || error.status) + ')';
    } else if (error.status === 503) {
      errorMessage = 'Yapay zeka servisi şu an çok yoğun. Lütfen biraz bekleyip tekrar deneyin.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(200).json({ success: false, error: errorMessage });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
