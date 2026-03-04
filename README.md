# Meme Kanseri Destek Mobil Uygulaması

Bu proje, meme kanseri hastalarının semptom takibi, kan tahlili sonuçlarının arşivlenmesi, tıbbi belgelerin yüklenmesi ve uzman doktorlarla iletişim kurmasını (yazılı ve sesli olarak) sağlayan kapsamlı bir mobil uygulamadır.

Hem hastalar hem de onaylanmış tıbbi uzmanlar (doktorlar) platforma kayıt olabilir. Hastalar kendi süreçlerini takip edebilirken; uzman doktorlar ise kayıtlı hastaların profillerini (belirti takvimleri ve kan tahlili belgeleri dahil) inceleyebilir ve sorulan sorulara yazılı veya sesli yanıtlar verebilir.

---

## 📱 İndirme ve Demo

- **📥 APK İndir:** [Android cihazınıza kurmak için tıklayın](https://expo.dev/artifacts/eas/a7woaReYZA6awfhkWgM3PQ.apk)
- **🎥 Uygulama Demo Videosu:** [YouTube Üzerinden İzleyin](https://www.youtube.com/shorts/mg0WrVctY1M)

---

## 🛠 Kullanılan Teknolojiler

### Frontend (Mobil Uygulama)
- **React Native & Expo:** Çapraz platform mobil uygulama geliştirme çerçevesi.
- **Expo Router:** Dosya tabanlı uygulama içi sayfa yönlendirmesi.
- **TanStack React Query:** Asenkron veri ve state yönetimi.
- **Expo AV:** Ses kaydetme ve oynatma (Doktor & Hasta arası sesli iletişim için).
- **Zustand / Context API:** Genel uygulama state yapılandırması.
- **Lucide React Native:** Uygulama içi ikon seti.
- **Typescript:** Güçlü, tip güvenli JavaScript eklentisi.

### Backend (Sunucu & Veritabanı)
- **Node.js & Express.js:** RESTful API sunucu altyapısı.
- **MongoDB & Mongoose:** Esnek NoSQL veritabanı ve nesne modelleme.
- **JSON Web Tokens (JWT):** Kullanıcı oturumu yönetimi ve kimlik doğrulama.
- **Bcrypt.js:** Parola şifreleme ve güvenliği.

---

## 🚀 Yerelde Nasıl Çalıştıracağım? (Kurulum Adımları)

Proje temel olarak iki ana dizine ayrılmıştır: `backend` (Sunucu) ve `meme_kanseri` (Mobil Frontend).

### 1. Backend Kurulumu

1. Terminalinizi açın ve `backend` klasörüne gidin:
   ```bash
   cd backend
   ```
2. Gerekli bağımlılıkları (paketleri) yükleyin:
   ```bash
   npm install
   ```
3. Klasör içerisinde yer alan `.env` dosyasını kontrol edin. Eğer yoksa oluşturun ve aşağıdaki değişkenleri gerekli bilgilerle (kendi MongoDB adresiniz vb.) doldurun:
   ```env
   PORT=3001
   MONGODB_URI=mongodb+srv://<kullanici_adiniz>:<sifreniz>@cluster0.db.mongodb.net/memekanseri?retryWrites=true&w=majority
   JWT_SECRET=super_gizli_anahtar
   ADMIN_SECRET=123456
   ```
4. Veritabanının başlaması için sunucuyu çalıştırın:
   ```bash
   node server.js
   ```
   Çıktıda _"Veritabanına bağlanıldı!"_ mesajını görmelisiniz.

---

### 2. Frontend (Mobil) Kurulumu

*Not: Telefonunuzda fiziksel test yapmak istiyorsanız App Store veya Google Play Store'dan "Expo Go" uygulamasını indirmeniz gereklidir.*

1. Başka bir terminal penceresinde frontend klasörüne gidin:
   ```bash
   cd meme_kanseri
   ```
2. Tüm bağımlılıkları yükleyin (Bun veya Npm ile):
   ```bash
   npm install
   # veya
   bun install
   ```
3. Projedeki **API Yönlendirmesini (Base URL)** bilgisayarınızın yerel ağına göre ayarlayın:
   - `services/api.ts` dosyasını açın.
   - Dosya içerisindeki `BASE_URL` değişkenine, backend sunucunuzu çalıştıran bilgisayarın yerel (Local) `192.168.x.x` formatındaki IP adresini bulun ve 3001 portuyla ekleyin. *(Not: Expo Go ile test ederken `localhost` telefonda çalışmaz.)*
   ```typescript
   export const BASE_URL = 'http://192.168.X.X:3001';
   ```
4. Expo sunucusunu başlatın:
   ```bash
   npx expo start
   # veya
   bun run start
   ```
5. Konsolda çıkacak olan QR kodunu cihazınızın kamerasına veya direkt Expo uygulamasının içinden okutarak uygulamayı telefonunuzda test etmeye başlayabilirsiniz.

---

## 🔑 Kullanıcı Senaryoları & Test

- **Hasta Olarak:** Kayıt olup giriş yapabilirsiniz (kayıtta sizden yaş doğrulama amaçlı doğum tarihi ve şehir istenir). Kan tahlilinizi fotoğraf olarak yükleyip, doktorlara sistem üzerinden soru sorabilirsiniz.
- **Doktor Olarak:** Kayıt ekranında "Uzman Kaydı"nı seçin. Doktor kayıtları varsayılan olarak `pending` statüsünde beklemede kalır. Veritabanından (veya projedeki admin scriptinden) rolünüzün `active`'e alınmasının ardından giriş yapabilirsiniz. Hastalarım arayüzünde platforma üye olan hastaların tahlillerine, belirttiği güncel sorulara ulaşıp direkt **sesli mesaj** kaydederek yanıtlayabilirsiniz.
