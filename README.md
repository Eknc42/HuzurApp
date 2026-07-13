# Huzur

React Native (0.84) ile geliştirilmiş, Kur’an dinleme, ruh haline göre ayet önerileri ve kişisel ilham kartlarını bir araya getiren bir uygulama.

## Özellikler

- **Onboarding**: İlk açılışta karşılama; tamamlandığında `AsyncStorage` ile bir daha gösterilmez.
- **Ana sayfa**: Günün ayeti (takvim gününe göre dönen havuz), ruh halleri, hızlı erişim kartları.
- **Kur’an**: mp3quran.net API ile hafız, sure dinleme, radyo ve premium oynatıcı akışları.
- **Ruha özel ayet**: Ruh haline göre önerilen ayetler, tilavet (islamic.network CDN, Alafası), metin kartı.
- **Manevi yansıma**: Kartlarda hazırlanan yorum metinleri (harici yapay zekâ API’si kullanılmaz).
- **Kayıtlar**: Ayetleri yer imi/kalp ile saklama (`AsyncStorage`); listeden uzun basılı tutarak kaldırma.
- **Paylaş**: Ayet kartını görüntüleme olarak kaydetme ve sistem paylaşım sayfası (Instagram Stories vb. seçilebilir).
- **Widget ekranı**: Kilit ekranı widget tasarımı için konsept önizleme; sistem widget’ı değildir.

## Gereksinimler

- Node.js ≥ 22.11 (`package.json` engines)
- Xcode / CocoaPods (iOS), Android SDK (Android)

## Kurulum ve çalıştırma

```sh
npm install
npm start
```

Başka bir terminalde:

```sh
npm run android
# veya
npm run ios
```

iOS yerel bağımlılıklar için:

```sh
cd ios && bundle exec pod install && cd ..
```

## Testler

```sh
npm test
```

## İzinler (paylaşım / galeri)

- **iOS**: `NSPhotoLibraryAddUsageDescription`, `NSPhotoLibraryUsageDescription` (`Info.plist`)
- **Android**: Internet, medya okuma / eski sürümler için depolama izinleri (`AndroidManifest.xml`)

## Teknik notlar

- Navigasyon: `@react-navigation/native-stack`
- Ses: `react-native-sound`, ambient ve radyo URL’leri
- Paylaşım / ekran görüntüsü: `react-native-view-shot`, `react-native-share`, `@react-native-camera-roll/camera-roll`

## Lisans

Özel proje — `private: true`.
