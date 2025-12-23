import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { currentUser } = useAuth();
  const userId = currentUser ? currentUser.uid : null;
  const [toys, setToys] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "toys"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setToys(data);
    });

    return () => unsub();
  }, []);

  const rentToy = async (toyId) => {
    if (!userId) {
      alert("Lütfen giriş yapın!");
      return;
    }

    const toyRef = doc(db, "toys", toyId);
    await updateDoc(toyRef, {
      isAvailable: false,
      rentedBy: userId,
      rentedAt: serverTimestamp()
    });

    alert("Oyuncak kiralandı!");
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-xl font-bold mb-4">Oyuncaklar</h1>

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

      {toys.filter(toy =>
        toy.isAvailable &&
        toy.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map((toy) => (
        <div key={toy.id} className="border rounded-xl p-4 mb-4 shadow-sm bg-white">
          <h2 className="font-bold text-lg text-gray-800">{toy.name}</h2>
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

            {toy.isAvailable ? (
              <button onClick={() => rentToy(toy.id)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-blue-200 shadow-md">
                Kirala
              </button>
            ) : (
              <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-lg">
                ✅ Kiraladın
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
