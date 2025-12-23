import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function MyRentals() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [rentedToys, setRentedToys] = useState([]);
    const [myToys, setMyToys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("rented"); // 'rented' or 'owned'

    useEffect(() => {
        if (!currentUser) return;

        // 1. Query for toys rented by the current user
        const qRented = query(
            collection(db, "toys"),
            where("rentedBy", "==", currentUser.uid),
            orderBy("rentedAt", "desc")
        );

        const unsubRented = onSnapshot(qRented, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setRentedToys(data);
            if (activeTab === "rented") setLoading(false);
        }, (error) => {
            console.error("Rented query error:", error);
            if (activeTab === "rented") setLoading(false);
        });

        // 2. Query for toys owned by the current user
        const qOwned = query(
            collection(db, "toys"),
            where("ownerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubOwned = onSnapshot(qOwned, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMyToys(data);
            setLoading(false);
        }, (error) => {
            console.error("Owned query error:", error);
            setLoading(false);
        });

        return () => {
            unsubRented();
            unsubOwned();
        };
    }, [currentUser, activeTab]);

    const handleDelete = async (toyId) => {
        if (window.confirm("Bu oyuncağı silmek istediğinize emin misiniz?")) {
            try {
                await deleteDoc(doc(db, "toys", toyId));
                alert("Oyuncak başarıyla silindi.");
            } catch (error) {
                console.error("Error deleting toy:", error);
                alert("Hata: Oyuncak silinemedi.");
            }
        }
    };

    if (loading) {
        return <div className="p-4 text-center">Yükleniyor...</div>;
    }

    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Kiralama & Oyuncaklarım</h1>

            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab("rented")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'rented' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Kiraladıklarım ({rentedToys.length})
                </button>
                <button
                    onClick={() => setActiveTab("owned")}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'owned' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Oyuncaklarım ({myToys.length})
                </button>
            </div>

            {activeTab === "rented" ? (
                rentedToys.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <span className="text-4xl mb-3 block">🧸</span>
                        <p className="text-gray-500">Henüz hiç oyuncak kiralamadınız.</p>
                        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 font-semibold">Göz atın →</button>
                    </div>
                ) : (
                    rentedToys.map((toy) => (
                        <div key={toy.id} className="border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm bg-white">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="font-bold text-lg text-gray-800">{toy.name}</h2>
                                <span className="text-green-600 text-xs font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100">Aktif</span>
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-gray-500 mb-3">
                                <span className="bg-gray-50 px-2 py-1 rounded-md">🎂 {toy.ageRange}</span>
                                <span className="bg-gray-50 px-2 py-1 rounded-md">📍 {toy.city}</span>
                            </div>

                            <div className="flex justify-between items-end mt-4 pt-3 border-t border-gray-50">
                                <div className="text-xs text-gray-400">
                                    <p>Kiralama Tarihi:</p>
                                    <p className="font-medium text-gray-700 mt-0.5">
                                        {toy.rentedAt && typeof toy.rentedAt.toDate === 'function'
                                            ? toy.rentedAt.toDate().toLocaleDateString('tr-TR')
                                            : 'Tarih belirtilmedi'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate(`/oyuncak/${toy.id}`)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Detay
                                </button>
                            </div>
                        </div>
                    ))
                )
            ) : (
                myToys.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                        <span className="text-4xl mb-3 block">➕</span>
                        <p className="text-gray-500">Henüz bir oyuncak eklemediniz.</p>
                        <button onClick={() => navigate("/ekle")} className="mt-4 text-blue-600 font-semibold">Yeni Ekle →</button>
                    </div>
                ) : (
                    myToys.map((toy) => (
                        <div key={toy.id} className="border border-gray-100 rounded-2xl p-4 mb-4 shadow-sm bg-white relative">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="font-bold text-lg text-gray-800">{toy.name}</h2>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${toy.isAvailable ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                    {toy.isAvailable ? 'Kirada Değil' : 'Şu an Kirada'}
                                </span>
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                                <span className="text-blue-600 font-bold text-sm">₺{toy.price}/gün</span>
                                <span className="bg-gray-50 px-2 py-1 rounded-md">🎂 {toy.ageRange}</span>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => navigate(`/oyuncak/${toy.id}/duzenle`)}
                                    className="flex-1 bg-gray-50 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-100 border border-gray-200"
                                >
                                    Düzenle
                                </button>
                                <button
                                    onClick={() => handleDelete(toy.id)}
                                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100"
                                >
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))
                )
            )}
        </div>
    );
}
