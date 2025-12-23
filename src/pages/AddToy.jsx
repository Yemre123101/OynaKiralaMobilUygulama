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
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const toyCategories = [
    "Action Figures", "Animals", "Educational", "Dolls", "Electronic", "Creative", "Sports", "Other"
  ];

  const handleCategoryChange = (cat) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

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
    if (categories.length === 0) return alert("Lütfen en az bir kategori seçiniz!");

    setLoading(true);

    try {
      let imageUrl = "";

      if (image) {
        let uploadFile = image;
        try {
          // Compress the image before uploading (600px width, 0.5 quality for speed)
          uploadFile = await compressImage(image, 600, 0.5);
        } catch (compressionError) {
          console.warn("Image compression failed, uploading original:", compressionError);
        }

        const storageRef = ref(storage, `toy_images/${currentUser.uid}_${Date.now()}`);
        await uploadBytes(storageRef, uploadFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "toys"), {
        name,
        description,
        city,
        categories,
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
      setCategories([]);
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

        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Şehir Seçiniz</option>
          <option value="Adana">Adana</option>
          <option value="Adıyaman">Adıyaman</option>
          <option value="Afyonkarahisar">Afyonkarahisar</option>
          <option value="Ağrı">Ağrı</option>
          <option value="Amasya">Amasya</option>
          <option value="Ankara">Ankara</option>
          <option value="Antalya">Antalya</option>
          <option value="Artvin">Artvin</option>
          <option value="Aydın">Aydın</option>
          <option value="Balıkesir">Balıkesir</option>
          <option value="Bilecik">Bilecik</option>
          <option value="Bingöl">Bingöl</option>
          <option value="Bitlis">Bitlis</option>
          <option value="Bolu">Bolu</option>
          <option value="Burdur">Burdur</option>
          <option value="Bursa">Bursa</option>
          <option value="Çanakkale">Çanakkale</option>
          <option value="Çankırı">Çankırı</option>
          <option value="Çorum">Çorum</option>
          <option value="Denizli">Denizli</option>
          <option value="Diyarbakır">Diyarbakır</option>
          <option value="Edirne">Edirne</option>
          <option value="Elazığ">Elazığ</option>
          <option value="Erzincan">Erzincan</option>
          <option value="Erzurum">Erzurum</option>
          <option value="Eskişehir">Eskişehir</option>
          <option value="Gaziantep">Gaziantep</option>
          <option value="Giresun">Giresun</option>
          <option value="Gümüşhane">Gümüşhane</option>
          <option value="Hakkari">Hakkari</option>
          <option value="Hatay">Hatay</option>
          <option value="Isparta">Isparta</option>
          <option value="Mersin">Mersin</option>
          <option value="İstanbul">İstanbul</option>
          <option value="İzmir">İzmir</option>
          <option value="Kars">Kars</option>
          <option value="Kastamonu">Kastamonu</option>
          <option value="Kayseri">Kayseri</option>
          <option value="Kırklareli">Kırklareli</option>
          <option value="Kırşehir">Kırşehir</option>
          <option value="Kocaeli">Kocaeli</option>
          <option value="Konya">Konya</option>
          <option value="Kütahya">Kütahya</option>
          <option value="Malatya">Malatya</option>
          <option value="Manisa">Manisa</option>
          <option value="Kahramanmaraş">Kahramanmaraş</option>
          <option value="Mardin">Mardin</option>
          <option value="Muğla">Muğla</option>
          <option value="Muş">Muş</option>
          <option value="Nevşehir">Nevşehir</option>
          <option value="Niğde">Niğde</option>
          <option value="Ordu">Ordu</option>
          <option value="Rize">Rize</option>
          <option value="Sakarya">Sakarya</option>
          <option value="Samsun">Samsun</option>
          <option value="Siirt">Siirt</option>
          <option value="Sinop">Sinop</option>
          <option value="Sivas">Sivas</option>
          <option value="Tekirdağ">Tekirdağ</option>
          <option value="Tokat">Tokat</option>
          <option value="Trabzon">Trabzon</option>
          <option value="Tunceli">Tunceli</option>
          <option value="Şanlıurfa">Şanlıurfa</option>
          <option value="Uşak">Uşak</option>
          <option value="Van">Van</option>
          <option value="Yozgat">Yozgat</option>
          <option value="Zonguldak">Zonguldak</option>
          <option value="Aksaray">Aksaray</option>
          <option value="Bayburt">Bayburt</option>
          <option value="Karaman">Karaman</option>
          <option value="Kırıkkale">Kırıkkale</option>
          <option value="Batman">Batman</option>
          <option value="Şırnak">Şırnak</option>
          <option value="Bartın">Bartın</option>
          <option value="Ardahan">Ardahan</option>
          <option value="Iğdır">Iğdır</option>
          <option value="Yalova">Yalova</option>
          <option value="Karabük">Karabük</option>
          <option value="Kilis">Kilis</option>
          <option value="Osmaniye">Osmaniye</option>
          <option value="Düzce">Düzce</option>
        </select>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Kategoriler (Birden fazla seçebilirsiniz)</label>
          <div className="grid grid-cols-2 gap-2">
            {toyCategories.map((cat) => (
              <label key={cat} className={`flex items-center p-2 border rounded-xl cursor-pointer transition-colors ${categories.includes(cat) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={categories.includes(cat)}
                  onChange={() => handleCategoryChange(cat)}
                />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </div>

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
