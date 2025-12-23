import { useEffect, useState } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

export default function RecommendedToys() {
  const [toys, setToys] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "toys"),
      orderBy("createdAt", "desc"),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setToys(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-3">
        🎯 Önerilen Oyuncaklar
      </h2>

      {toys.length === 0 ? (
        <p className="text-gray-500">
          Henüz önerilen oyuncak yok.
        </p>
      ) : (
        <div className="space-y-3">
          {toys.map((toy) => (
            <div
              key={toy.id}
              className="border rounded-lg p-3 bg-white shadow"
            >
              <h3 className="font-semibold">{toy.name}</h3>
              <p className="text-sm text-gray-600">
                {toy.description}
              </p>
              <p className="text-sm">
                🎂 {toy.ageRange} • 📍 {toy.city}
              </p>
              <p className="font-bold text-blue-600">
                ₺{toy.price} / gün
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
