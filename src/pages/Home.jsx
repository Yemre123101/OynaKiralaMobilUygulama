import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const userId = currentUser ? currentUser.uid : null;
  const [toys, setToys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userCity, setUserCity] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    minAge: 0,
    maxAge: 15,
    gender: "",
    minPrice: "",
    maxPrice: "",
    city: "",
    category: ""
  });

  useEffect(() => {
    // Fetch User City
    const fetchUserCity = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setUserCity(userDoc.data().city);
          }
        } catch (error) {
          console.error("Error fetching user city:", error);
        }
      }
    };
    fetchUserCity();

    // Fetch Toys
    const q = query(collection(db, "toys"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setToys(data);
    });

    return () => unsub();
  }, [userId]);

  // Logic for "Toys that you might interest"
  // Filter available toys in user's city and pick a few with different categories
  const interestedToys = (() => {
    if (!userCity) return [];
    const sameCityToys = toys.filter(t => t.isAvailable && t.city === userCity);

    // Group by category to ensure variety
    const categoryMap = {};
    sameCityToys.forEach(toy => {
      const cats = toy.categories || ["Diğer"];
      cats.forEach(cat => {
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(toy);
      });
    });

    // Pick one from each category found
    const result = [];
    const seenIds = new Set();
    Object.keys(categoryMap).forEach(cat => {
      const toy = categoryMap[cat].find(t => !seenIds.has(t.id));
      if (toy) {
        result.push(toy);
        seenIds.add(toy.id);
      }
    });

    return result.slice(0, 4); // Show top 4 interesting ones
  })();

  const applyFilters = (toy) => {
    // Search filter
    const matchesSearch = toy.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Age filter logic: toy.ageRange is "X-Y", filters are minAge and maxAge
    let matchesAge = true;
    if (toy.ageRange) {
      const toyAgeParts = toy.ageRange.split('-').map(p => parseInt(p.trim()));
      const toyMin = toyAgeParts[0];
      const toyMax = toyAgeParts.length > 1 ? toyAgeParts[1] : toyMin;

      // Intersection logic: [toyMin, toyMax] overlaps with [filters.minAge, filters.maxAge]
      // Which means toyMin <= filters.maxAge AND toyMax >= filters.minAge
      matchesAge = (toyMin <= filters.maxAge && toyMax >= filters.minAge);
    }

    const matchesGender = filters.gender ? toy.gender === filters.gender : true;
    const matchesMinPrice = filters.minPrice ? parseFloat(toy.price) >= parseFloat(filters.minPrice) : true;
    const matchesMaxPrice = filters.maxPrice ? parseFloat(toy.price) <= parseFloat(filters.maxPrice) : true;
    const matchesCity = filters.city ? toy.city === filters.city : true;
    const matchesCategory = filters.category ? toy.categories?.includes(filters.category) : true;

    return matchesSearch && matchesAge && matchesGender && matchesMinPrice && matchesMaxPrice && matchesCity && matchesCategory;
  };

  const recommendedToys = toys.filter(toy =>
    toy.isAvailable &&
    userCity &&
    toy.city === userCity &&
    applyFilters(toy)
  );

  const otherToys = toys.filter(toy =>
    toy.isAvailable &&
    (!userCity || toy.city !== userCity) &&
    applyFilters(toy)
  );

  const ToyCard = ({ toy }) => (
    <div key={toy.id} className="border rounded-xl p-4 mb-4 shadow-sm bg-white" onClick={() => navigate(`/oyuncak/${toy.id}`)}>
      <div className="flex justify-between items-start">
        <h2 className="font-bold text-lg text-gray-800">{toy.name}</h2>
        {toy.categories && toy.categories.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1">
            {toy.categories.slice(0, 2).map(cat => (
              <span key={cat} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-gray-600 text-sm mt-1 mb-2 line-clamp-2">{toy.description}</p>

      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
        <span className="flex items-center">
          <span className="mr-1">🎂</span> {toy.ageRange}
        </span>
        <span className="flex items-center">
          <span className="mr-1">📍</span> {toy.city}
        </span>
        {toy.gender && (
          <span className="flex items-center">
            <span className="mr-1">{toy.gender === "Erkek" ? "👦" : toy.gender === "Kız" ? "👧" : "🚻"}</span> {toy.gender}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
        <p className="font-bold text-blue-600 text-lg">₺{toy.price} <span className="text-sm text-gray-400 font-normal">/ gün</span></p>

        <button onClick={(e) => {
          e.stopPropagation(); // prevent triggering parent div click
          navigate(`/oyuncak/${toy.id}`);
        }} className="bg-gray-100 text-blue-600 px-5 py-2 rounded-lg font-medium transition-colors hover:bg-gray-200">
          İncele
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 pb-20">

      {/* Arama Çubuğu */}
      <div className="mb-4 sticky top-0 bg-gray-50 z-10 py-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Oyuncak adı ile ara..."
              className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`p-3 border rounded-xl shadow-sm transition-all ${Object.values(filters).some(v => v !== "") ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtreleme Modalı */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">Filtrele</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-5">
              {/* Yaş Aralığı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Yaş Aralığı ({filters.minAge} - {filters.maxAge} Yaş)</label>
                <div className="space-y-4 px-2">
                  <div className="relative h-2 bg-gray-100 rounded-full">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={filters.minAge}
                      onChange={(e) => setFilters({ ...filters, minAge: Math.min(parseInt(e.target.value), filters.maxAge) })}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer accent-blue-600 z-20 pointer-events-auto"
                    />
                    <input
                      type="range"
                      min="0"
                      max="15"
                      value={filters.maxAge}
                      onChange={(e) => setFilters({ ...filters, maxAge: Math.max(parseInt(e.target.value), filters.minAge) })}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer accent-blue-600 z-10 pointer-events-auto"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">
                    <span>0 Yaş</span>
                    <span>15+ Yaş</span>
                  </div>
                </div>
              </div>

              {/* Cinsiyet */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cinsiyet</label>
                <div className="flex gap-2">
                  {["Erkek", "Kız", "Unisex"].map(gender => (
                    <button
                      key={gender}
                      onClick={() => setFilters({ ...filters, gender: filters.gender === gender ? "" : gender })}
                      className={`flex-1 py-2 px-3 border rounded-xl text-sm font-medium transition-all ${filters.gender === gender ? "bg-blue-600 border-blue-600 text-white shadow-md scale-105" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400"}`}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fiyat Aralığı */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fiyat Aralığı (₺/gün)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Şehir */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Şehir</label>
                <select
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tüm Şehirler</option>
                  {Array.from(new Set(toys.map(t => t.city).filter(Boolean))).sort().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Tüm Kategoriler</option>
                  {["Action Figures", "Animals", "Educational", "Dolls", "Electronic", "Creative", "Sports", "Other"].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setFilters({ minAge: 0, maxAge: 15, gender: "", minPrice: "", maxPrice: "", city: "", category: "" })}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-all"
                >
                  Temizle
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "İlgini Çekebilecekler" Section */}
      {interestedToys.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">❤️</span>
            <h2 className="text-xl font-bold">İlgini Çekebilecekler</h2>
          </div>
          <div className="grid gap-4">
            {interestedToys.map(toy => <ToyCard key={`interest-${toy.id}`} toy={toy} />)}
          </div>
        </div>
      )}

      {/* Recommended Section (Same City) */}
      {recommendedToys.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-3">
            <span className="text-2xl mr-2">🌟</span>
            <h2 className="text-xl font-bold">Şehrindeki Diğer Oyuncaklar</h2>
            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{userCity}</span>
          </div>
          <div className="grid gap-4">
            {recommendedToys.filter(t => !interestedToys.some(it => it.id === t.id)).map(toy => <ToyCard key={toy.id} toy={toy} />)}
          </div>
        </div>
      )}

      {/* Other Toys Section */}
      <div>
        <h2 className="text-xl font-bold mb-3">{recommendedToys.length > 0 ? "Diğer Şehirlerdekiler" : "Tüm Oyuncaklar"}</h2>
        <div className="grid gap-4">
          {otherToys.length > 0 ? (
            otherToys.map(toy => <ToyCard key={toy.id} toy={toy} />)
          ) : (
            <div className="text-center text-gray-500 py-8">
              {recommendedToys.length === 0 && interestedToys.length === 0 && <p>Aradığınız kriterlere uygun oyuncak bulunamadı.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
