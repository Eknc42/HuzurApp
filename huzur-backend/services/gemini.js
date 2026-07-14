require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function askGemini(question, context, mode = "rag") {

  let prompt = "";

  //-------------------------------------------------
  // RAG MODE
  //-------------------------------------------------

  if (mode === "rag") {

    prompt = `
Sen Huzur AI'sın (İslami Yapay Zeka Asistanı).

SADECE aşağıda verilen bağlamı (context) kullanarak cevap ver.

Asla kendi genel bilgini kullanma. Asla Kur'an ayeti uydurma. Asla Hadis uydurma.

Eğer sorunun cevabı aşağıdaki bağlamda (context) yoksa, SADECE şu cümleyi söyle:
"Bu konuda bilgi tabanımda yeterli bilgi bulunamadı."

Cevap verirken daima yararlandığın kaynakları belirt. Lütfen yanıtını akıcı, düzgün ve tamamen Türkçe dilinde ver. Yabancı kelimeler veya harfler kullanma.

BAĞLAM (CONTEXT):
${context}

SORU:
${question}
`;

  }

  //-------------------------------------------------
  // MIXED MODE
  //-------------------------------------------------

  else if (mode === "mixed") {

    prompt = `
Sen Huzur AI'sın (İslami Yapay Zeka Asistanı).

Sana yerel bilgi tabanından (veritabanından) bazı kaynaklar (bağlam/context) sağlandı.
İlk olarak, kullanıcının sorusunu SADECE bu bağlamı kullanarak cevaplamaya çalış.

KRİTİK KURALLAR:
1. Eğer verilen bağlam kullanıcının sorusunun cevabını İÇERMİYORSA, bağlamı tamamen GÖRMEZDEN GEL. Bağlamın neyle ilgili olduğundan bahsetme ve kaynakları listeleme.
2. Eğer bağlam tamamen alakasızsa, tıpkı Diyanet Modunda olduğun gibi davranmalısın:
   - Cevabı SADECE Türkiye Diyanet İşleri Başkanlığı'nın (Diyanet) fetvalarına ve bilgilerine dayanarak ver.
   - Diyanet'i açıkça kaynak göster (örneğin, "Diyanet İşleri Başkanlığı'nın açıklamasına göre...").
   - Kendi genel bilgisini KULLANMA.
   - Cevabının en başına tam olarak şu gizli etiketi yaz: "[DIYANET_MODU]" (Bunun dışında veritabanında bulunamadığına dair hiçbir şey söyleme, sadece cevabı ver).
3. Eğer bağlam KISMEN alakalıysa ve cevabı tamamlamak için Diyanet bilgilerine de ihtiyacın varsa:
   - Önce sağlanan bağlama göre cevabı yaz.
   - Ardından, yeşil bir ayırıcı çizgi eklemek için yeni bir satıra tam olarak [SEPARATOR] kelimesini ekle (başında ve sonunda boşluk olacak şekilde).
   - [SEPARATOR] kelimesinin altına, ek Diyanet fetvasını/bilgisini yaz.
4. Eğer bağlam TAM cevabı içeriyorsa, soruyu sadece bağlamı kullanarak cevapla ve kaynakları açıkça belirt. [SEPARATOR] kullanma.

Asla Kur'an ayeti uydurma. Asla Hadis uydurma.
Lütfen yanıtını akıcı, düzgün ve tamamen Türkçe dilinde ver. Yabancı kelimeler (İngilizce vb.) veya Çince karakterler kesinlikle kullanma.

BAĞLAM (CONTEXT):
${context}

SORU:
${question}
`;

  }

  //-------------------------------------------------
  // GENERAL MODE (Diyanet Search Mode)
  //-------------------------------------------------

  else {

    prompt = `
Sen Huzur AI'sın (İslami Yapay Zeka Asistanı).

Yerel bilgi tabanı yeterli bilgi içermiyor.
Kendi genel bilgin yerine, internette SADECE Türkiye Diyanet İşleri Başkanlığı'nın resmi web sitelerini hedef alarak arama yapmış gibi davranmalısın.

1. Kullanıcının sorusunu Diyanet'in resmi web sitelerine (kurul.diyanet.gov.tr, fetva.diyanet.gov.tr, diyanet.gov.tr vb.) dayandır.
2. Cevabı SADECE Diyanet'ten bulduğun fetvalara ve bilgilere dayanarak yaz.
3. Diyanet'i açıkça kaynak göster (örneğin, "Diyanet İşleri Başkanlığı'nın açıklamasına göre...").
4. Kendi genel bilgine dayanarak cevap verme. Eğer Diyanet'in bu konuda hiçbir bilgisi yoksa, "Türkiye Diyanet İşleri Başkanlığı'nın kaynaklarında bu konuya dair güncel bir fetva veya bilgi bulunamadı." de.

Lütfen yanıtını akıcı, düzgün ve tamamen Türkçe dilinde ver. Yabancı kelimeler veya harfler kullanma.

Cevabının en başına tam olarak şu gizli etiketi yaz:
[DIYANET_MODU]

Bunun dışında veritabanında bulunamadığına dair hiçbir şey söyleme, sadece cevabı ver.

SORU:
${question}
`;

  }

  let retries = 3;
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      lastError = error;
      if (error.status === 503 || error.status === 429) {
        console.warn(`Groq Error. Retrying in ${i + 1} seconds...`);
        await new Promise(r => setTimeout(r, (i + 1) * 1000));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

module.exports = {
  askGemini, // Kept the same exported name to avoid changing index.js
};
