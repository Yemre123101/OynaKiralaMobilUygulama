import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function MyRentals() {
    const { currentUser } = useAuth();
    const [rentedToys, setRentedToys] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) return;

        // Query for toys rented by the current user
        const q = query(
            collection(db, "toys"),
            where("rentedBy", "==", currentUser.uid),
            orderBy("rentedAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRentedToys(data);
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    if (loading) {
        return <div className="p-4 text-center">Yükleniyor...</div>;
    }

    return (
        <div className="p-4 pb-20">
            <h1 className="text-xl font-bold mb-4">Kiralamalarım</h1>

            {rentedToys.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <p>Henüz hiç oyuncak kiralamadınız.</p>
                </div>
            ) : (
                rentedToys.map((toy) => (
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
                            <div className="text-sm text-gray-500">
                                <p>Kiralama Tarihi:</p>
                                <p className="font-medium text-gray-900">
                                    {toy.rentedAt?.toDate().toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                            <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-lg">
                                Aktif Kiralama
                            </span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
