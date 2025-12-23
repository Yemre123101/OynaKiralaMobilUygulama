import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function ToysByAge({ ageRange }) {
  const [toys, setToys] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "toys"),
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((toy) => toy.ageRange === ageRange);

        setToys(data);
      }
    );

    return () => unsubscribe();
  }, [ageRange]);

  if (toys.length === 0) return null;

  return (
  <div className="mb-8">
    <h2 className="text-lg font-bold mb-3">
      🎂 {ageRange} Yaş İçin Oyuncaklar
    </h2>

    {toys.length === 0 ? (
      <p className="text-gray-500">
        Bu yaş aralığı için oyuncak bulunamadı.
      </p>
    ) : (
      <div className="space-y-3">
        {toys.map((toy) => (
          <div
            key={toy.id}
            className="border rounded-lg p-3 bg-white shadow"
          >
            <h3 className="font-semibold">{toy.name}</h3>
            <p className="text-sm text-gray-600">{toy.description}</p>
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
