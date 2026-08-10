const express = require('express');
const cors = require('cors');
const { analyzeQuestion } = require('./services/questionAnalyzer');
const { researchFatwa } = require('./services/fatwaResearch');
const { createGroundedAnswer } = require('./services/gemini');

const app = express();
app.use(cors());
app.use(express.json({ limit: '32kb' }));

function publicSource(source) {
  return {
    name: source.name,
    title: source.title,
    url: source.url,
    type: source.type,
    level: source.level,
    madhhab: source.madhhab,
  };
}

function hydrateAnswer(generated, researchedSources, analysis) {
  const getSources = ids => ids.map(id => researchedSources[id - 1]).filter(Boolean).map(publicSource);
  const usedSources = getSources(generated.source_ids);
  const views = generated.views.map(view => ({
    label: view.label,
    answer: view.answer,
    sources: getSources(view.source_ids),
  }));

  if (analysis.comparison && !generated.general_knowledge) {
    const requestedLabels = ['Hanefi', 'Şafii', 'Maliki', 'Hanbeli', 'Diyanet', 'IIFA', 'Dar al-Ifta'];
    requestedLabels.forEach(label => {
      if (!views.some(view => view.label.toLocaleLowerCase('tr-TR').includes(label.toLocaleLowerCase('tr-TR')))) {
        views.push({
          label,
          answer: `Bu konuda güvenilir ve doğrulanabilir bir ${label} kaynağı bulunamadı.`,
          sources: [],
        });
      }
    });
  }

  const sourcedMadhhabCount = ['Hanefi', 'Şafii', 'Maliki', 'Hanbeli'].filter(label => (
    views.some(view => (
      view.label.toLocaleLowerCase('tr-TR').includes(label.toLocaleLowerCase('tr-TR'))
      && view.sources.length > 0
    ))
  )).length;
  const incompleteMadhhabComparison = analysis.comparison
    && !generated.general_knowledge
    && sourcedMadhhabCount < 4;
  const incompleteComparisonMessage = 'Dört mezhebin tamamı için güvenilir ve doğrulanabilir kaynak bulunamadı. Bu nedenle mezheplerin ortak hükmüymüş gibi kesin bir sonuç verilemez; yalnızca aşağıdaki doğrulanmış görüşler aktarılabilir.';

  return {
    success: true,
    answer: incompleteMadhhabComparison ? incompleteComparisonMessage : generated.answer,
    short_answer: incompleteMadhhabComparison ? incompleteComparisonMessage : generated.short_answer,
    has_multiple_views: generated.has_multiple_views || views.length > 1,
    topic: generated.topic,
    analysis,
    sources: usedSources,
    views,
    searched_live: true,
    answer_basis: generated.general_knowledge ? 'general_ai_knowledge' : 'verified_web_sources',
    source_warning: generated.general_knowledge
      ? 'Bu yanıt için doğrulanabilir web kaynağı bulunamadı; içerik genel AI bilgisine dayanır.'
      : null,
    can_compare: !analysis.comparison && usedSources.length > 0,
  };
}

function resolveContextualQuestion(question, history) {
  const currentAnalysis = analyzeQuestion(question);
  if (currentAnalysis.topic !== 'İslami bilgi' || !Array.isArray(history)) return question;

  const previousUserMessage = [...history].reverse().find(item => (
    item?.role === 'user' && typeof item.content === 'string' && item.content.trim()
  ));
  if (!previousUserMessage) return question;

  const previousAnalysis = analyzeQuestion(previousUserMessage.content);
  if (previousAnalysis.topic === 'İslami bilgi') return question;
  return `${previousAnalysis.topic} hakkında: ${question}`;
}

async function handleChat(req, res) {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  if (!question) return res.status(400).json({ success: false, error: 'Soru gereklidir.' });
  if (question.length > 500) return res.status(400).json({ success: false, error: 'Soru 500 karakterden kısa olmalıdır.' });

  try {
    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-6).map(item => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        content: String(item?.content || '').slice(0, 500),
      }))
      : [];
    const resolvedQuestion = resolveContextualQuestion(question, history);
    const analysis = analyzeQuestion(resolvedQuestion, Boolean(req.body?.compare));
    const researchedSources = await researchFatwa(resolvedQuestion, analysis);
    const generated = await createGroundedAnswer(resolvedQuestion, analysis, researchedSources);
    return res.json(hydrateAnswer(generated, researchedSources, analysis));
  } catch (error) {
    console.error('Live fatwa research error:', error);
    const rateLimited = error.status === 429;
    return res.status(rateLimited ? 429 : 503).json({
      success: false,
      error: rateLimited
        ? 'Araştırma servisi geçici olarak yoğun. Lütfen biraz sonra tekrar deneyin.'
        : 'Güvenilir kaynak araştırması şu anda tamamlanamadı. Kesin bir yanıt vermek istemiyorum.',
    });
  }
}

app.post('/api/chat', handleChat);
app.post('/api/chat/compare', (req, res) => handleChat({ ...req, body: { ...req.body, compare: true } }, res));
app.get('/health', (_req, res) => res.json({ ok: true, mode: 'live-web-research' }));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Backend is running on port ${port}`));
}

module.exports = { app, handleChat, hydrateAnswer, resolveContextualQuestion };
