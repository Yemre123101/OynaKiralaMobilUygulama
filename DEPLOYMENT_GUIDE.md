# Oyna-Kirala Uygulamasını Yayınlama Rehberi

Bu rehber, geliştirdiğiniz "Oyna-Kirala" uygulamasını internette herkesin erişimine açmak (yayınlamak) için izlemeniz gereken adımları içerir. Projemiz **Vite + React** ve **Firebase** kullandığı için en kolay ve ücretsiz yayınlama yöntemi **Firebase Hosting**'dir.

## Seçenek 1: Firebase Hosting (Önerilen)

Zaten veritabanı ve kimlik doğrulama için Firebase kullandığımızdan, uygulamanızı da Firebase üzerinde barındırmak en mantıklı seçenektir.

### 1. Hazırlık
Öncelikle terminalde proje klasörünüzde olduğunuzdan emin olun.

### 2. Firebase Araçlarını Yükleyin
Eğer daha önce yüklemediyseniz, Firebase komut satırı araçlarını yüklemeniz gerekir:
```bash
npm install -g firebase-tools
```

### 3. Firebase'e Giriş Yapın
```bash
firebase login
```
Bu komut bir tarayıcı penceresi açacak ve Google hesabınızla giriş yapmanızı isteyecektir.

### 4. Projeyi Başlatın
```bash
firebase init
```
Bu komutu çalıştırdıktan sonra şu adımları takip edin:
1.  **"Which Firebase features do you want to set up?"** sorusunda:
    *   `Hosting: Configure files for Firebase Hosting and (optionally) set up GitHub Action deploys` seçeneğini **Space** tuşu ile seçin ve **Enter**'a basın.
2.  **"Please select an option"** sorusunda:
    *   `Use an existing project` seçin.
    *   Listeden **"oyna-kirala"** projenizi seçin.
3.  **"What do you want to use as your public directory?"** sorusunda:
    *   `dist` yazın ve Enter'a basın. (Vite varsayılan olarak `dist` klasörüne çıktı verir).
4.  **"Configure as a single-page app (rewrite all urls to /index.html)?"** sorusunda:
    *   `y` (Yes) yazın ve Enter'a basın. (Bu adım yönlendirmelerin düzgün çalışması için çok önemlidir).
5.  **"Set up automatic builds and deploys with GitHub?"** sorusunda:
    *   Şimdilik `n` (No) diyebilirsiniz.

### 5. Uygulamayı Derleyin (Build)
Uygulamanızın yayınlanmaya hazır, sıkıştırılmış ve optimize edilmiş versiyonunu oluşturun:
```bash
npm run build
```
Bu işlem sonucunda projenizde `dist` adında yeni bir klasör oluşacaktır.

### 6. Yayınlayın (Deploy)
Son olarak, `dist` klasörünü Firebase sunucularına gönderin:
```bash
firebase deploy
```

**Tebrikler!** Terminalde size verilen `https://oyna-kirala.web.app` (veya benzeri) linke tıklayarak uygulamanızı canlı olarak görebilirsiniz. Bu linki arkadaşlarınızla paylaşabilirsiniz.

---

## Seçenek 2: Vercel (Alternatif)

Vercel, React uygulamalarını yayınlamak için çok popüler ve hızlı bir alternatiftir.

1.  Uygulamanızı **GitHub**'a yükleyin.
2.  [Vercel.com](https://vercel.com) adresine gidin ve üye olun.
3.  "Add New Project" diyerek GitHub'daki "oyna-kirala" projenizi seçin.
4.  Vercel, Vite kullandığınızı otomatik algılayacaktır.
5.  "Deploy" butonuna basın.

**Dikkat:** Vercel kullanırsanız, Firebase Authentication ayarlarında (Firebase Console -> Authentication -> Settings -> Authorized Domains) Vercel'in size verdiği domain adresini (örn: `oyna-kirala.vercel.app`) "Authorized Domains" listesine eklemeniz gerekir. Aksi takdirde Google ile giriş vb. çalışmayabilir.

## Önemli Notlar

*   **Güvenlik Kuralları (Firestore Rules):** Uygulamayı yayınlamadan önce, veritabanınızın güvenli olduğundan emin olun. Şu anki geliştirme kuralları herkese okuma/yazma izni veriyor olabilir. Firebase Console -> Firestore -> Rules kısmından sadece yetkili kullanıcıların işlem yapabileceği şekilde kuralları güncellemelisiniz.
*   **Mobil Uygulama Gibi Kullanım:** Kullanıcılarınız siteyi Chrome (Android) veya Safari (iOS) üzerinden açıp "Ana Ekrana Ekle" dediklerinde, uygulamanız tam ekran bir mobil uygulama gibi çalışacaktır.
