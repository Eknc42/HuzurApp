// Huzur — Hafız (Kâri) Veritabanı
// 5 ünlü Kur'an okuyucusu — AlQuran Cloud ses CDN tanımlayıcıları
// Fotoğraflar: QuranCDN API (api.qurancdn.com) — qdcId ile eşleştirilmiştir

// QuranCDN CDN'inden fotoğraf URL'i üret
const QDC_PHOTO_BASE = 'https://cdn.qurancdn.com/images/reciters';
const qdcPhoto = (qdcId, slug) =>
  `${QDC_PHOTO_BASE}/${qdcId}/${slug}-profile.jpeg`;

export const RECITERS = [
  {
    id: 'abdulbasit',
    name: 'عبد الباسط عبد الصمد',
    nameTr: 'Abdülbasit Abdüssamed',
    nameEn: 'Abdul Basit Abdus Samad',
    style: 'Murattel',
    styleTr: 'Güçlü ve Duygusal',
    country: '🇪🇬 Mısır',
    audioId: 'ar.abdulbasitmurattal',
    audioBaseUrl: 'https://server7.mp3quran.net/basit',
    color: '#d4a574',
    qdcId: 2,
    photo: qdcPhoto(2, 'abdul-baset-abdul-samad'),
  },
  {
    id: 'alafasy',
    name: 'مشاري بن راشد العفاسي',
    nameTr: 'Mishary Rashid Alafasy',
    nameEn: 'Mishary Rashid Alafasy',
    style: 'Murattel',
    styleTr: 'Melodik ve Net',
    country: '🇰🇼 Kuveyt',
    audioId: 'ar.alafasy',
    audioBaseUrl: 'https://server8.mp3quran.net/afs',
    color: '#10b981',
    qdcId: 7,
    photo: qdcPhoto(7, 'mishari-rashid-al-afasy'),
  },
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    nameTr: 'Abdurrahman es-Sudeysi',
    nameEn: 'Abdur-Rahman as-Sudais',
    style: 'Murattel',
    styleTr: 'Etkileyici ve Otoriter',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.abdurrahmaansudais',
    audioBaseUrl: 'https://server11.mp3quran.net/sds',
    color: '#60a5fa',
    qdcId: 3,
    photo: qdcPhoto(3, 'abdurrahman-as-sudais'),
  },
  {
    id: 'shatri',
    name: 'أبو بكر الشاطري',
    nameTr: 'Ebu Bekr eş-Şatıri',
    nameEn: 'Abu Bakr al-Shatri',
    style: 'Murattel',
    styleTr: 'Sakin ve Berrak',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.shaatree',
    audioBaseUrl: 'https://server11.mp3quran.net/shatri',
    color: '#a78bfa',
    qdcId: 4,
    photo: qdcPhoto(4, 'abu-bakr-al-shatri'),
  },
  {
    id: 'rifai',
    name: 'هاني الرفاعي',
    nameTr: 'Hani er-Rifai',
    nameEn: 'Hani ar-Rifai',
    style: 'Murattel',
    styleTr: 'Duygusal ve Sıcak',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.hanirifai',
    audioBaseUrl: 'https://server8.mp3quran.net/hani',
    color: '#f59e0b',
    qdcId: 5,
    photo: qdcPhoto(5, 'hani-ar-rifai'),
  },
  {
    id: 'husary',
    name: 'محمود خليل الحصري',
    nameTr: 'Mahmud Halil el-Husari',
    nameEn: 'Mahmoud Khalil Al-Husary',
    style: 'Murattel',
    styleTr: 'Klasik ve Tecvitli',
    country: '🇪🇬 Mısır',
    audioId: 'ar.husary',
    audioBaseUrl: 'https://server13.mp3quran.net/husr',
    color: '#ec4899',
    qdcId: 6,
    photo: qdcPhoto(6, 'mahmoud-khalil-al-husary'),
  },
  {
    id: 'minshawi',
    name: 'محمد صديق المنشاوي',
    nameTr: 'Muhammed Sıddık el-Minşavi',
    nameEn: 'Mohamed Siddiq al-Minshawi',
    style: 'Murattel',
    styleTr: 'Manevi ve Derin',
    country: '🇪🇬 Mısır',
    audioId: 'ar.minshawi',
    audioBaseUrl: 'https://server10.mp3quran.net/minsh',
    color: '#14b8a6',
    qdcId: 9,
    photo: qdcPhoto(9, 'mohamed-siddiq-al-minshawi'),
  },
  {
    id: 'shuraim',
    name: 'سعود الشريم',
    nameTr: 'Saud eş-Şureym',
    nameEn: 'Saud ash-Shuraim',
    style: 'Murattel',
    styleTr: 'Vakur ve Etkileyici',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.saoodshuraym',
    audioBaseUrl: 'https://server12.mp3quran.net/shoraimy',
    color: '#8b5cf6',
    qdcId: 10,
    photo: qdcPhoto(10, 'saud-ash-shuraim'),
  },
  {
    id: 'dosari',
    name: 'ياسر الدوسري',
    nameTr: 'Yasser Al-Dosari',
    nameEn: 'Yasser Al-Dosari',
    style: 'Murattel',
    styleTr: 'Duygusal ve Coşkulu',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.yasseraddussary',
    audioBaseUrl: 'https://server11.mp3quran.net/yasser',
    color: '#fb7185',
    qdcId: 97,
    photo: qdcPhoto(97, 'yasser-ad-dussary'),
  },
  {
    id: 'tunaiji',
    name: 'خليفة الطنيجي',
    nameTr: 'Halife et-Tüneyci',
    nameEn: 'Khalifah Al Tunaiji',
    style: 'Murattel',
    styleTr: 'Saygın ve Sade',
    country: '🇦🇪 BAE',
    audioId: 'ar.tunaiji',
    audioBaseUrl: 'https://server12.mp3quran.net/tnjy',
    color: '#0ea5e9',
    qdcId: 161,
    photo: qdcPhoto(161, 'khalifah-al-tunaiji'),
  },
  {
    id: 'turki',
    name: 'بدر التركi',
    nameTr: 'Bedr et-Türki',
    nameEn: 'Badr Al-Turki',
    style: 'Murattel',
    styleTr: 'Sakin ve Etkileyici',
    country: '🇸🇦 S. Arabistan',
    audioId: 'ar.badrturki',
    audioBaseUrl: 'https://server10.mp3quran.net/bader/Rewayat-Hafs-A-n-Assem',
    color: '#84cc16',
    qdcId: null,
    photo: null,
  },
];

/**
 * QuranCDN API'sinden tüm hafız fotoğraflarını çekip
 * RECITERS listesindeki photo alanlarını günceller.
 * İnternet bağlantısı varsa daha güncel URL'ler döner.
 *
 * Kullanım (örneğin HomeScreen veya App.tsx'te):
 *   import { hydrateReciterPhotos } from '../data/reciters';
 *   useEffect(() => { hydrateReciterPhotos(); }, []);
 */
export async function hydrateReciterPhotos() {
  try {
    const res = await fetch('https://api.qurancdn.com/api/qdc/audio/reciters?per_page=100');
    if (!res.ok) return;
    const json = await res.json();
    const apiReciters = json?.reciters ?? [];

    RECITERS.forEach(reciter => {
      const match = apiReciters.find(r => r.id === reciter.qdcId);
      if (match?.profile_picture) {
        reciter.photo = match.profile_picture;
      }
    });
  } catch (e) {
    // Sessizce başarısız ol — statik fotoğraflar zaten tanımlı
    console.warn('[Huzur] Hafız fotoğrafları güncellenemedi:', e.message);
  }
}

export function getReciterById(id) {
  return RECITERS.find(r => r.id === id) || RECITERS[0];
}

export function getDefaultReciter() {
  return RECITERS.find(r => r.id === 'sudais') || RECITERS[0]; // Abdurrahman es-Sudeysi
}