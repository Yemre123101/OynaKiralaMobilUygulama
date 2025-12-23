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

  const recommendedToys = toys.filter(toy =>
    toy.isAvailable &&
    userCity &&
    toy.city === userCity &&
    toy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const otherToys = toys.filter(toy =>
    toy.isAvailable &&
    (!userCity || toy.city !== userCity) &&
    toy.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="relative">
          <input
            type="text"
            placeholder="Oyuncak adı ile ara..."
            className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

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
