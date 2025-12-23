import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { compressImage } from "../utils/imageUtils";

export default function AddToy() {
  const { currentUser } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return alert("Giriş yapmalısınız!");

    setLoading(true);

    try {
      let imageUrl = "";

      if (image) {
        // Compress the image before uploading
        const compressedImage = await compressImage(image);
        const storageRef = ref(storage, `toy_images/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(storageRef, compressedImage);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "toys"), {
        name,
        description,
        city,
        ageRange,
        price,
        imageUrl,
        ownerId: currentUser.uid,
        isAvailable: true,
        rentedBy: null,
        rentedAt: null,
        createdAt: serverTimestamp(),
      });

      alert("Oyuncak başarıyla eklendi!");

      setName("");
      setDescription("");
      setCity("");
      setAgeRange("");
      setPrice("");
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Oyuncak Ekle</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Fotoğraf Yükleme Alanı */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {preview ? (
            <div className="relative">
              <img src={preview} alt="Önizleme" className="mx-auto h-48 object-cover rounded-md" />
              <button
                type="button"
                onClick={() => { setImage(null); setPreview(null); }}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 transform translate-x-1/2 -translate-y-1/2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Fotoğraf Ekle
              </span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>
          )}
        </div>

        <input
          type="text"
          placeholder="Oyuncak Adı"
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <textarea
          placeholder="Açıklama"
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
        />

        <input
          type="text"
          placeholder="Şehir"
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Yaş Aralığı (örn: 3-6)"
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          value={ageRange}
          onChange={(e) => setAgeRange(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Günlük Fiyat (₺)"
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-200 shadow-md disabled:bg-gray-400"
        >
          {loading ? "Yükleniyor..." : "Kaydet"}
        </button>
      </form>
    </div>
  );
}
