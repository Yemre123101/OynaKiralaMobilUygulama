import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { compressImage } from "../utils/imageUtils";

export default function EditToy() {
    const { id } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [city, setCity] = useState("");
    const [ageRange, setAgeRange] = useState("");
    const [price, setPrice] = useState("");
    const [categories, setCategories] = useState([]);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const toyCategories = [
        "Action Figures", "Animals", "Educational", "Dolls", "Electronic", "Creative", "Sports", "Other"
    ];

    useEffect(() => {
        const fetchToy = async () => {
            try {
                const docRef = doc(db, "toys", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.ownerId !== currentUser.uid) {
                        alert("Bu oyuncağı düzenleme yetkiniz yok!");
                        navigate("/");
                        return;
                    }
                    setName(data.name);
                    setDescription(data.description);
                    setCity(data.city);
                    setAgeRange(data.ageRange);
                    setPrice(data.price);
                    setCategories(data.categories || []);
                    setPreview(data.imageUrl);
                } else {
                    alert("Oyuncak bulunamadı!");
                    navigate("/");
                }
            } catch (error) {
                console.error("Error fetching toy:", error);
            } finally {
                setFetching(false);
            }
        };

        if (currentUser) fetchToy();
    }, [id, currentUser, navigate]);

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
        setLoading(true);

        try {
            let imageUrl = preview;

            if (image) {
                let uploadFile = image;
                try {
                    uploadFile = await compressImage(image, 600, 0.5);
                } catch (err) {
                    console.warn("Compression failed:", err);
                }
                const storageRef = ref(storage, `toy_images/${currentUser.uid}_${Date.now()}`);
                await uploadBytes(storageRef, uploadFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(doc(db, "toys", id), {
                name,
                description,
                city,
                categories,
                ageRange,
                price,
                imageUrl,
                updatedAt: new Date(),
            });

            alert("Oyuncak başarıyla güncellendi!");
            navigate("/kiralamalarim");
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-4 text-center">Yükleniyor...</div>;

    const turkeyCities = [
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    ];

    return (
        <div className="p-4 pb-20">
            <h1 className="text-xl font-bold mb-4">Oyuncağı Düzenle</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {preview ? (
                        <div className="relative">
                            <img src={preview} alt="Önizleme" className="mx-auto h-48 object-cover rounded-md" />
                            <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        </div>
                    ) : (
                        <label className="cursor-pointer block">
                            <span className="mt-2 block text-sm font-medium text-gray-900">Fotoğraf Ekle</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Oyuncak Adı"
                    className="w-full border p-3 rounded-lg bg-gray-50 outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />

                <textarea
                    placeholder="Açıklama"
                    className="w-full border p-3 rounded-lg bg-gray-50 outline-none font-sans"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={3}
                />

                <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full border p-3 rounded-lg bg-gray-50 outline-none font-sans"
                >
                    <option value="">Şehir Seçiniz</option>
                    {turkeyCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 font-sans">Kategoriler</label>
                    <div className="grid grid-cols-2 gap-2">
                        {toyCategories.map((cat) => (
                            <label key={cat} className={`flex items-center p-2 border rounded-xl cursor-pointer transition-colors ${categories.includes(cat) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                <input type="checkbox" className="hidden" checked={categories.includes(cat)} onChange={() => handleCategoryChange(cat)} />
                                <span className="text-sm font-sans">{cat}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex space-x-2">
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 font-sans">Yaş Aralığı</label>
                        <input
                            type="text"
                            className="w-full border p-3 rounded-lg bg-gray-50 outline-none font-sans"
                            value={ageRange}
                            onChange={(e) => setAgeRange(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="text-xs text-gray-500 font-sans">Günlük Fiyat (₺)</label>
                        <input
                            type="number"
                            className="w-full border p-3 rounded-lg bg-gray-50 outline-none font-sans"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition duration-200 shadow-md disabled:bg-gray-400 font-sans"
                >
                    {loading ? "Güncelleniyor..." : "Güncelle"}
                </button>
            </form>
        </div>
    );
}
