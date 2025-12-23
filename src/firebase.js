import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Firebase Console'dan (console.firebase.google.com) aldığın yapılandırma kodlarını buraya yapıştır.
// "Proje Ayarları" -> "Genel" -> "Uygulamalarım" kısmından bulabilirsin.
const firebaseConfig = {
    // Örnek format (Kendi verilerini tırnak içine yapıştır):
    apiKey: "AIzaSyDjULzoErDhc7-Scxjq3B1T5-FsqoRrkpY",
    authDomain: "oyna-kirala.firebaseapp.com",
    projectId: "oyna-kirala",
    storageBucket: "oyna-kirala.firebasestorage.app",
    messagingSenderId: "169292062514",
    appId: "1:169292062514:web:66b149473e47f73db9812b"
};

// Uygulamayı başlat
const app = initializeApp(firebaseConfig);

// Servisleri dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
