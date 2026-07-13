// prayerTimes.js — Prayer time data for all 81 Turkish provinces
// Simulates a Diyanet API response. In production, replace with real API calls.
// Times are approximate summer values for demonstration purposes.

/**
 * All 81 provinces with their prayer times.
 * Key is a URL-safe slug for storage/lookup.
 */
export const CITIES = {
  adana:       { city: 'Adana',         plate: '01', lat: 37.00, lng: 35.32, times: { Fajr: '03:31', Sunrise: '05:16', Dhuhr: '12:42', Asr: '16:34', Maghrib: '20:08', Isha: '21:53' } },
  adiyaman:    { city: 'Adıyaman',      plate: '02', lat: 37.76, lng: 38.28, times: { Fajr: '03:22', Sunrise: '05:10', Dhuhr: '12:35', Asr: '16:28', Maghrib: '20:01', Isha: '21:49' } },
  afyon:       { city: 'Afyonkarahisar', plate: '03', lat: 38.73, lng: 30.54, times: { Fajr: '03:30', Sunrise: '05:24', Dhuhr: '12:52', Asr: '16:46', Maghrib: '20:20', Isha: '22:14' } },
  agri:        { city: 'Ağrı',          plate: '04', lat: 39.72, lng: 43.05, times: { Fajr: '02:55', Sunrise: '04:53', Dhuhr: '12:18', Asr: '16:14', Maghrib: '19:42', Isha: '21:40' } },
  amasya:      { city: 'Amasya',        plate: '05', lat: 40.65, lng: 35.83, times: { Fajr: '03:06', Sunrise: '05:06', Dhuhr: '12:34', Asr: '16:30', Maghrib: '20:02', Isha: '22:02' } },
  ankara:      { city: 'Ankara',        plate: '06', lat: 39.93, lng: 32.86, times: { Fajr: '03:22', Sunrise: '05:18', Dhuhr: '12:47', Asr: '16:42', Maghrib: '20:16', Isha: '22:12' } },
  antalya:     { city: 'Antalya',        plate: '07', lat: 36.88, lng: 30.71, times: { Fajr: '03:42', Sunrise: '05:30', Dhuhr: '12:56', Asr: '16:48', Maghrib: '20:22', Isha: '22:10' } },
  artvin:      { city: 'Artvin',         plate: '08', lat: 41.18, lng: 41.82, times: { Fajr: '02:48', Sunrise: '04:52', Dhuhr: '12:20', Asr: '16:18', Maghrib: '19:48', Isha: '21:52' } },
  aydin:       { city: 'Aydın',          plate: '09', lat: 37.85, lng: 27.85, times: { Fajr: '03:44', Sunrise: '05:36', Dhuhr: '13:04', Asr: '16:58', Maghrib: '20:32', Isha: '22:24' } },
  balikesir:   { city: 'Balıkesir',      plate: '10', lat: 39.65, lng: 27.88, times: { Fajr: '03:28', Sunrise: '05:26', Dhuhr: '12:57', Asr: '16:54', Maghrib: '20:28', Isha: '22:26' } },
  bilecik:     { city: 'Bilecik',        plate: '11', lat: 40.06, lng: 30.00, times: { Fajr: '03:22', Sunrise: '05:22', Dhuhr: '12:52', Asr: '16:48', Maghrib: '20:22', Isha: '22:22' } },
  bingol:      { city: 'Bingöl',         plate: '12', lat: 38.88, lng: 40.49, times: { Fajr: '03:04', Sunrise: '04:58', Dhuhr: '12:24', Asr: '16:20', Maghrib: '19:50', Isha: '21:44' } },
  bitlis:      { city: 'Bitlis',         plate: '13', lat: 38.40, lng: 42.11, times: { Fajr: '03:00', Sunrise: '04:54', Dhuhr: '12:18', Asr: '16:14', Maghrib: '19:42', Isha: '21:36' } },
  bolu:        { city: 'Bolu',           plate: '14', lat: 40.73, lng: 31.61, times: { Fajr: '03:14', Sunrise: '05:16', Dhuhr: '12:46', Asr: '16:44', Maghrib: '20:16', Isha: '22:18' } },
  burdur:      { city: 'Burdur',         plate: '15', lat: 37.72, lng: 30.29, times: { Fajr: '03:36', Sunrise: '05:28', Dhuhr: '12:54', Asr: '16:48', Maghrib: '20:20', Isha: '22:12' } },
  bursa:       { city: 'Bursa',          plate: '16', lat: 40.19, lng: 29.06, times: { Fajr: '03:24', Sunrise: '05:24', Dhuhr: '12:54', Asr: '16:52', Maghrib: '20:24', Isha: '22:24' } },
  canakkale:   { city: 'Çanakkale',      plate: '17', lat: 40.15, lng: 26.41, times: { Fajr: '03:28', Sunrise: '05:30', Dhuhr: '13:02', Asr: '17:00', Maghrib: '20:34', Isha: '22:36' } },
  cankiri:     { city: 'Çankırı',        plate: '18', lat: 40.60, lng: 33.62, times: { Fajr: '03:12', Sunrise: '05:12', Dhuhr: '12:42', Asr: '16:40', Maghrib: '20:12', Isha: '22:12' } },
  corum:       { city: 'Çorum',          plate: '19', lat: 40.55, lng: 34.96, times: { Fajr: '03:10', Sunrise: '05:10', Dhuhr: '12:38', Asr: '16:36', Maghrib: '20:06', Isha: '22:06' } },
  denizli:     { city: 'Denizli',        plate: '20', lat: 37.77, lng: 29.09, times: { Fajr: '03:40', Sunrise: '05:32', Dhuhr: '12:58', Asr: '16:52', Maghrib: '20:24', Isha: '22:16' } },
  diyarbakir:  { city: 'Diyarbakır',     plate: '21', lat: 37.91, lng: 40.24, times: { Fajr: '03:10', Sunrise: '05:02', Dhuhr: '12:26', Asr: '16:22', Maghrib: '19:50', Isha: '21:42' } },
  edirne:      { city: 'Edirne',         plate: '22', lat: 41.67, lng: 26.56, times: { Fajr: '03:14', Sunrise: '05:20', Dhuhr: '12:56', Asr: '16:56', Maghrib: '20:32', Isha: '22:38' } },
  elazig:      { city: 'Elazığ',         plate: '23', lat: 38.67, lng: 39.22, times: { Fajr: '03:10', Sunrise: '05:04', Dhuhr: '12:30', Asr: '16:26', Maghrib: '19:56', Isha: '21:50' } },
  erzincan:    { city: 'Erzincan',       plate: '24', lat: 39.75, lng: 39.49, times: { Fajr: '03:02', Sunrise: '04:58', Dhuhr: '12:26', Asr: '16:22', Maghrib: '19:54', Isha: '21:50' } },
  erzurum:     { city: 'Erzurum',        plate: '25', lat: 39.90, lng: 41.27, times: { Fajr: '02:54', Sunrise: '04:52', Dhuhr: '12:20', Asr: '16:18', Maghrib: '19:48', Isha: '21:46' } },
  eskisehir:   { city: 'Eskişehir',      plate: '26', lat: 39.77, lng: 30.52, times: { Fajr: '03:26', Sunrise: '05:24', Dhuhr: '12:52', Asr: '16:48', Maghrib: '20:20', Isha: '22:18' } },
  gaziantep:   { city: 'Gaziantep',      plate: '27', lat: 37.07, lng: 37.38, times: { Fajr: '03:24', Sunrise: '05:14', Dhuhr: '12:38', Asr: '16:32', Maghrib: '20:02', Isha: '21:52' } },
  giresun:     { city: 'Giresun',        plate: '28', lat: 40.91, lng: 38.39, times: { Fajr: '02:56', Sunrise: '04:58', Dhuhr: '12:28', Asr: '16:26', Maghrib: '19:58', Isha: '22:00' } },
  gumushane:   { city: 'Gümüşhane',      plate: '29', lat: 40.46, lng: 39.48, times: { Fajr: '02:56', Sunrise: '04:56', Dhuhr: '12:26', Asr: '16:22', Maghrib: '19:56', Isha: '21:56' } },
  hakkari:     { city: 'Hakkari',        plate: '30', lat: 37.57, lng: 43.74, times: { Fajr: '02:56', Sunrise: '04:48', Dhuhr: '12:10', Asr: '16:06', Maghrib: '19:32', Isha: '21:24' } },
  hatay:       { city: 'Hatay',          plate: '31', lat: 36.40, lng: 36.35, times: { Fajr: '03:32', Sunrise: '05:18', Dhuhr: '12:42', Asr: '16:34', Maghrib: '20:06', Isha: '21:52' } },
  isparta:     { city: 'Isparta',        plate: '32', lat: 37.76, lng: 30.56, times: { Fajr: '03:36', Sunrise: '05:28', Dhuhr: '12:54', Asr: '16:48', Maghrib: '20:20', Isha: '22:12' } },
  mersin:      { city: 'Mersin',         plate: '33', lat: 36.80, lng: 34.64, times: { Fajr: '03:34', Sunrise: '05:20', Dhuhr: '12:46', Asr: '16:38', Maghrib: '20:12', Isha: '21:58' } },
  istanbul:    { city: 'İstanbul',       plate: '34', lat: 41.01, lng: 28.98, times: { Fajr: '03:18', Sunrise: '05:22', Dhuhr: '12:56', Asr: '16:54', Maghrib: '20:30', Isha: '22:34' } },
  izmir:       { city: 'İzmir',          plate: '35', lat: 38.42, lng: 27.14, times: { Fajr: '03:38', Sunrise: '05:32', Dhuhr: '13:02', Asr: '16:56', Maghrib: '20:32', Isha: '22:26' } },
  kars:        { city: 'Kars',           plate: '36', lat: 40.60, lng: 43.10, times: { Fajr: '02:42', Sunrise: '04:44', Dhuhr: '12:14', Asr: '16:12', Maghrib: '19:44', Isha: '21:46' } },
  kastamonu:   { city: 'Kastamonu',      plate: '37', lat: 41.38, lng: 33.78, times: { Fajr: '03:06', Sunrise: '05:10', Dhuhr: '12:42', Asr: '16:40', Maghrib: '20:14', Isha: '22:18' } },
  kayseri:     { city: 'Kayseri',        plate: '38', lat: 38.73, lng: 35.49, times: { Fajr: '03:20', Sunrise: '05:14', Dhuhr: '12:40', Asr: '16:36', Maghrib: '20:06', Isha: '22:00' } },
  kirklareli:  { city: 'Kırklareli',     plate: '39', lat: 41.74, lng: 27.22, times: { Fajr: '03:12', Sunrise: '05:18', Dhuhr: '12:56', Asr: '16:56', Maghrib: '20:34', Isha: '22:40' } },
  kirsehir:    { city: 'Kırşehir',       plate: '40', lat: 39.15, lng: 34.17, times: { Fajr: '03:18', Sunrise: '05:14', Dhuhr: '12:42', Asr: '16:38', Maghrib: '20:10', Isha: '22:06' } },
  kocaeli:     { city: 'Kocaeli',        plate: '41', lat: 40.85, lng: 29.88, times: { Fajr: '03:18', Sunrise: '05:20', Dhuhr: '12:52', Asr: '16:50', Maghrib: '20:24', Isha: '22:26' } },
  konya:       { city: 'Konya',          plate: '42', lat: 37.87, lng: 32.48, times: { Fajr: '03:30', Sunrise: '05:22', Dhuhr: '12:50', Asr: '16:44', Maghrib: '20:18', Isha: '22:10' } },
  kutahya:     { city: 'Kütahya',        plate: '43', lat: 39.42, lng: 29.98, times: { Fajr: '03:28', Sunrise: '05:26', Dhuhr: '12:56', Asr: '16:52', Maghrib: '20:26', Isha: '22:24' } },
  malatya:     { city: 'Malatya',        plate: '44', lat: 38.35, lng: 38.31, times: { Fajr: '03:14', Sunrise: '05:06', Dhuhr: '12:32', Asr: '16:28', Maghrib: '19:58', Isha: '21:50' } },
  manisa:      { city: 'Manisa',         plate: '45', lat: 38.61, lng: 27.43, times: { Fajr: '03:36', Sunrise: '05:32', Dhuhr: '13:02', Asr: '16:56', Maghrib: '20:32', Isha: '22:28' } },
  kahramanmaras: { city: 'Kahramanmaraş', plate: '46', lat: 37.58, lng: 36.93, times: { Fajr: '03:24', Sunrise: '05:14', Dhuhr: '12:40', Asr: '16:34', Maghrib: '20:06', Isha: '21:56' } },
  mardin:      { city: 'Mardin',         plate: '47', lat: 37.31, lng: 40.74, times: { Fajr: '03:10', Sunrise: '05:00', Dhuhr: '12:22', Asr: '16:18', Maghrib: '19:44', Isha: '21:34' } },
  mugla:       { city: 'Muğla',          plate: '48', lat: 37.22, lng: 28.36, times: { Fajr: '03:46', Sunrise: '05:36', Dhuhr: '13:02', Asr: '16:54', Maghrib: '20:28', Isha: '22:18' } },
  mus:         { city: 'Muş',            plate: '49', lat: 38.75, lng: 41.49, times: { Fajr: '02:58', Sunrise: '04:54', Dhuhr: '12:20', Asr: '16:16', Maghrib: '19:46', Isha: '21:42' } },
  nevsehir:    { city: 'Nevşehir',       plate: '50', lat: 38.63, lng: 34.71, times: { Fajr: '03:22', Sunrise: '05:16', Dhuhr: '12:42', Asr: '16:38', Maghrib: '20:08', Isha: '22:02' } },
  nigde:       { city: 'Niğde',          plate: '51', lat: 37.97, lng: 34.68, times: { Fajr: '03:26', Sunrise: '05:18', Dhuhr: '12:44', Asr: '16:38', Maghrib: '20:10', Isha: '22:02' } },
  ordu:        { city: 'Ordu',           plate: '52', lat: 40.98, lng: 37.88, times: { Fajr: '02:56', Sunrise: '05:00', Dhuhr: '12:30', Asr: '16:28', Maghrib: '20:00', Isha: '22:04' } },
  rize:        { city: 'Rize',           plate: '53', lat: 41.02, lng: 40.52, times: { Fajr: '02:46', Sunrise: '04:50', Dhuhr: '12:22', Asr: '16:20', Maghrib: '19:54', Isha: '21:58' } },
  sakarya:     { city: 'Sakarya',        plate: '54', lat: 40.67, lng: 30.40, times: { Fajr: '03:18', Sunrise: '05:20', Dhuhr: '12:50', Asr: '16:48', Maghrib: '20:20', Isha: '22:22' } },
  samsun:      { city: 'Samsun',         plate: '55', lat: 41.29, lng: 36.33, times: { Fajr: '03:00', Sunrise: '05:04', Dhuhr: '12:34', Asr: '16:32', Maghrib: '20:04', Isha: '22:08' } },
  siirt:       { city: 'Siirt',          plate: '56', lat: 37.93, lng: 41.94, times: { Fajr: '03:02', Sunrise: '04:54', Dhuhr: '12:18', Asr: '16:14', Maghrib: '19:42', Isha: '21:34' } },
  sinop:       { city: 'Sinop',          plate: '57', lat: 42.03, lng: 35.15, times: { Fajr: '02:58', Sunrise: '05:04', Dhuhr: '12:36', Asr: '16:36', Maghrib: '20:08', Isha: '22:14' } },
  sivas:       { city: 'Sivas',          plate: '58', lat: 39.75, lng: 37.01, times: { Fajr: '03:08', Sunrise: '05:04', Dhuhr: '12:32', Asr: '16:28', Maghrib: '20:00', Isha: '21:56' } },
  tekirdag:    { city: 'Tekirdağ',       plate: '59', lat: 41.00, lng: 27.52, times: { Fajr: '03:18', Sunrise: '05:22', Dhuhr: '12:58', Asr: '16:56', Maghrib: '20:34', Isha: '22:38' } },
  tokat:       { city: 'Tokat',          plate: '60', lat: 40.31, lng: 36.55, times: { Fajr: '03:06', Sunrise: '05:06', Dhuhr: '12:34', Asr: '16:30', Maghrib: '20:02', Isha: '22:02' } },
  trabzon:     { city: 'Trabzon',        plate: '61', lat: 41.00, lng: 39.72, times: { Fajr: '02:50', Sunrise: '04:54', Dhuhr: '12:24', Asr: '16:22', Maghrib: '19:54', Isha: '21:58' } },
  tunceli:     { city: 'Tunceli',        plate: '62', lat: 39.11, lng: 39.55, times: { Fajr: '03:06', Sunrise: '05:00', Dhuhr: '12:28', Asr: '16:24', Maghrib: '19:56', Isha: '21:50' } },
  sanliurfa:   { city: 'Şanlıurfa',      plate: '63', lat: 37.17, lng: 38.79, times: { Fajr: '03:18', Sunrise: '05:08', Dhuhr: '12:32', Asr: '16:26', Maghrib: '19:56', Isha: '21:46' } },
  usak:        { city: 'Uşak',           plate: '64', lat: 38.68, lng: 29.41, times: { Fajr: '03:34', Sunrise: '05:28', Dhuhr: '12:58', Asr: '16:52', Maghrib: '20:28', Isha: '22:22' } },
  van:         { city: 'Van',            plate: '65', lat: 38.49, lng: 43.38, times: { Fajr: '02:52', Sunrise: '04:46', Dhuhr: '12:10', Asr: '16:06', Maghrib: '19:34', Isha: '21:28' } },
  yozgat:      { city: 'Yozgat',         plate: '66', lat: 39.82, lng: 34.80, times: { Fajr: '03:14', Sunrise: '05:12', Dhuhr: '12:40', Asr: '16:36', Maghrib: '20:08', Isha: '22:06' } },
  zonguldak:   { city: 'Zonguldak',      plate: '67', lat: 41.45, lng: 31.79, times: { Fajr: '03:10', Sunrise: '05:14', Dhuhr: '12:48', Asr: '16:46', Maghrib: '20:22', Isha: '22:26' } },
  aksaray:     { city: 'Aksaray',        plate: '68', lat: 38.37, lng: 34.03, times: { Fajr: '03:24', Sunrise: '05:18', Dhuhr: '12:44', Asr: '16:40', Maghrib: '20:10', Isha: '22:04' } },
  bayburt:     { city: 'Bayburt',        plate: '69', lat: 40.26, lng: 40.23, times: { Fajr: '02:52', Sunrise: '04:52', Dhuhr: '12:22', Asr: '16:20', Maghrib: '19:52', Isha: '21:52' } },
  karaman:     { city: 'Karaman',        plate: '70', lat: 37.18, lng: 33.23, times: { Fajr: '03:32', Sunrise: '05:22', Dhuhr: '12:48', Asr: '16:42', Maghrib: '20:14', Isha: '22:04' } },
  kirikkale:   { city: 'Kırıkkale',      plate: '71', lat: 39.85, lng: 33.51, times: { Fajr: '03:18', Sunrise: '05:16', Dhuhr: '12:44', Asr: '16:40', Maghrib: '20:12', Isha: '22:10' } },
  batman:      { city: 'Batman',         plate: '72', lat: 37.89, lng: 41.13, times: { Fajr: '03:06', Sunrise: '04:58', Dhuhr: '12:22', Asr: '16:18', Maghrib: '19:46', Isha: '21:38' } },
  sirnak:      { city: 'Şırnak',         plate: '73', lat: 37.42, lng: 42.46, times: { Fajr: '03:02', Sunrise: '04:52', Dhuhr: '12:16', Asr: '16:10', Maghrib: '19:40', Isha: '21:30' } },
  bartin:      { city: 'Bartın',         plate: '74', lat: 41.64, lng: 32.34, times: { Fajr: '03:06', Sunrise: '05:12', Dhuhr: '12:46', Asr: '16:44', Maghrib: '20:20', Isha: '22:26' } },
  ardahan:     { city: 'Ardahan',        plate: '75', lat: 41.11, lng: 42.70, times: { Fajr: '02:38', Sunrise: '04:42', Dhuhr: '12:14', Asr: '16:14', Maghrib: '19:46', Isha: '21:50' } },
  igdir:       { city: 'Iğdır',          plate: '76', lat: 39.92, lng: 44.05, times: { Fajr: '02:48', Sunrise: '04:46', Dhuhr: '12:12', Asr: '16:10', Maghrib: '19:38', Isha: '21:36' } },
  yalova:      { city: 'Yalova',         plate: '77', lat: 40.66, lng: 29.27, times: { Fajr: '03:20', Sunrise: '05:22', Dhuhr: '12:54', Asr: '16:52', Maghrib: '20:26', Isha: '22:28' } },
  karabuk:     { city: 'Karabük',        plate: '78', lat: 41.20, lng: 32.62, times: { Fajr: '03:08', Sunrise: '05:12', Dhuhr: '12:44', Asr: '16:42', Maghrib: '20:16', Isha: '22:20' } },
  kilis:       { city: 'Kilis',          plate: '79', lat: 36.72, lng: 37.12, times: { Fajr: '03:26', Sunrise: '05:14', Dhuhr: '12:40', Asr: '16:32', Maghrib: '20:06', Isha: '21:54' } },
  osmaniye:    { city: 'Osmaniye',       plate: '80', lat: 37.07, lng: 36.25, times: { Fajr: '03:30', Sunrise: '05:18', Dhuhr: '12:42', Asr: '16:36', Maghrib: '20:06', Isha: '21:54' } },
  duzce:       { city: 'Düzce',          plate: '81', lat: 40.84, lng: 31.16, times: { Fajr: '03:14', Sunrise: '05:18', Dhuhr: '12:48', Asr: '16:46', Maghrib: '20:18', Isha: '22:22' } },
};

/** Default city key */
export const DEFAULT_CITY_KEY = 'konya';

/**
 * Returns a sorted list of cities for the picker.
 * Each entry: { key, city, plate }
 */
export function getCityList() {
  return Object.entries(CITIES)
    .map(([key, data]) => ({ key, city: data.city, plate: data.plate }))
    .sort((a, b) => a.city.localeCompare(b.city, 'tr'));
}

/**
 * Returns today's prayer times for the given city key.
 */
export function getPrayerTimesForCity(cityKey) {
  const cityData = CITIES[cityKey] || CITIES[DEFAULT_CITY_KEY];
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return {
    date: dateStr,
    location: {
      city: cityData.city,
      country: 'Türkiye',
      plate: cityData.plate,
      latitude: cityData.lat,
      longitude: cityData.lng,
    },
    times: { ...cityData.times },
  };
}

// Legacy function — kept for backward compatibility
export function getPrayerTimesForToday() {
  return getPrayerTimesForCity(DEFAULT_CITY_KEY);
}

/**
 * Prayer metadata — Turkish labels, icons, and colors
 */
export const PRAYER_META = {
  Fajr:    { key: 'Fajr',    labelTr: 'İmsak',  labelEn: 'Fajr',    icon: 'fajr',    color: '#7dd3fc' },
  Sunrise: { key: 'Sunrise', labelTr: 'Güneş',  labelEn: 'Sunrise', icon: 'sunrise', color: '#fbbf24' },
  Dhuhr:   { key: 'Dhuhr',   labelTr: 'Öğle',   labelEn: 'Dhuhr',   icon: 'dhuhr',   color: '#fb923c' },
  Asr:     { key: 'Asr',     labelTr: 'İkindi', labelEn: 'Asr',     icon: 'asr',     color: '#f97316' },
  Maghrib: { key: 'Maghrib', labelTr: 'Akşam',  labelEn: 'Maghrib', icon: 'maghrib', color: '#c4b5fd' },
  Isha:    { key: 'Isha',    labelTr: 'Yatsı',  labelEn: 'Isha',    icon: 'isha',    color: '#94a3b8' },
};

export const PRAYER_ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
