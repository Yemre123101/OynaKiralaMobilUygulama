import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import ToyCard from "./ToyCard";

export default function RecommendedToys({ userId }) {
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

  if (toys.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-3">🎯 Önerilen Oyuncaklar</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {toys.map((toy) => (
          <ToyCard key={toy.id} toy={toy} userId={userId} />
        ))}
      </div>
    </div>
  );
}
