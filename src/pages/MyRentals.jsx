import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function MyRentals() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [myRentals, setMyRentals] = useState([]); // Tales I made
    const [incomingRentals, setIncomingRentals] = useState([]); // Requests for my toys
    const [myToys, setMyToys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("rented"); // 'rented', 'incoming', 'owned'

    useEffect(() => {
        if (!currentUser) return;

        // 1. My rentals (rentals I paid for)
        const qMyRentals = query(
            collection(db, "rentals"),
            where("renterId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubMyRentals = onSnapshot(qMyRentals, (snapshot) => {
            setMyRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            if (activeTab === "rented") setLoading(false);
        });

        // 2. Incoming rental requests (for my toys)
        const qIncoming = query(
            collection(db, "rentals"),
            where("ownerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubIncoming = onSnapshot(qIncoming, (snapshot) => {
            setIncomingRentals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // 3. My toys
        const qOwned = query(
            collection(db, "toys"),
            where("ownerId", "==", currentUser.uid),
            orderBy("createdAt", "desc")
        );

        const unsubOwned = onSnapshot(qOwned, (snapshot) => {
            setMyToys(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        return () => {
            unsubMyRentals();
            unsubIncoming();
            unsubOwned();
        };
    }, [currentUser, activeTab]);

    const approveRental = async (rentalId, toyId) => {
        if (!window.confirm("Ödemeyi aldığınızı ve kiralamayı onayladığınızı onaylıyor musunuz?")) return;

        try {
            // Update rental status
            await updateDoc(doc(db, "rentals", rentalId), {
                status: 'active',
                approvedAt: new Date()
            });

            // Update toy just to be sure
            await updateDoc(doc(db, "toys", toyId), {
                isAvailable: false
            });

            alert("Kiralama onaylandı!");
        } catch (error) {
            console.error(error);
            alert("Bir hata oluştu.");
        }
    };

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

    const getStatusBadge = (status) => {
        switch (status) {
            case 'waiting_approval': return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Onay Bekliyor</span>;
            case 'active': return <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Aktif</span>;
            case 'completed': return <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Tamamlandı</span>;
            default: return <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">{status}</span>;
        }
    };

    if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;

    return (
        <div className="p-4 pb-24 max-w-lg mx-auto min-h-screen bg-white">
            <h1 className="text-2xl font-black mb-6 text-gray-900 leading-tight">Yönetim Paneli</h1>

            {/* Tabs */}
            <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-gray-100">
                {[
                    { id: 'rented', label: 'Kiraladıklarım', count: myRentals.length },
                    { id: 'incoming', label: 'Gelenler', count: incomingRentals.filter(r => r.status === 'waiting_approval').length },
                    { id: 'owned', label: 'İlanlarım', count: myToys.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all relative ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {tab.label}
                        {tab.count > 0 && tab.id !== 'owned' && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-4">
                {activeTab === 'rented' && (
                    myRentals.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                            <span className="text-5xl block mb-4">🧸</span>
                            <p className="text-gray-500 font-bold">Henüz bir kiralama yapmadınız.</p>
                            <button onClick={() => navigate('/')} className="mt-4 text-blue-600 font-black text-sm">Oyuncaklara Göz At →</button>
                        </div>
                    ) : (
                        myRentals.map(rental => (
                            <div key={rental.id} className="bg-white border-2 border-gray-50 rounded-3xl p-5 shadow-sm hover:border-blue-100 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-black text-gray-900 truncate max-w-[150px]">{rental.toyName}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">EFT/HAVALE ÖDEMESİ</p>
                                    </div>
                                    {getStatusBadge(rental.status)}
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gray-50 p-3 rounded-2xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Tutar</p>
                                        <p className="font-black text-blue-600">₺{rental.totalPrice}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl">
                                        <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Süre</p>
                                        <p className="font-black text-gray-700">{rental.days} Gün</p>
                                    </div>
                                </div>

                                <button onClick={() => navigate(`/oyuncak/${rental.toyId}`)} className="w-full py-3 bg-gray-100 group-hover:bg-blue-600 group-hover:text-white rounded-2xl font-black text-xs transition-all text-gray-600"> Detay </button>
                            </div>
                        ))
                    )
                )}

                {activeTab === 'incoming' && (
                    incomingRentals.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                            <span className="text-5xl block mb-4">📥</span>
                            <p className="text-gray-500 font-bold">Henüz bir kiralama talebi gelmedi.</p>
                        </div>
                    ) : (
                        incomingRentals.map(rental => (
                            <div key={rental.id} className="bg-white border-2 border-orange-100 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                                {rental.status === 'waiting_approval' && <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Onay Bekliyor</div>}

                                <div className="mb-4">
                                    <h3 className="font-black text-gray-900">{rental.toyName}</h3>
                                    <p className="text-sm text-gray-500 font-medium">#{rental.id.substring(0, 8)} Talebi</p>
                                </div>

                                <div className="bg-orange-50 p-4 rounded-2xl mb-6 border border-orange-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-orange-700">Beklenen Ödeme</span>
                                        <span className="text-lg font-black text-orange-600">₺{rental.totalPrice}</span>
                                    </div>
                                    <p className="text-[10px] text-orange-600 leading-tight font-medium opacity-80">
                                        Lütfen banka hesabınıza bu tutarın gelip gelmediğini kontrol edin.
                                    </p>
                                </div>

                                {rental.status === 'waiting_approval' ? (
                                    <button
                                        onClick={() => approveRental(rental.id, rental.toyId)}
                                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all border-b-4 border-blue-800"
                                    >
                                        Ödemeyi Aldım ve Onayla
                                    </button>
                                ) : (
                                    <div className="text-center py-2 text-green-600 font-black text-sm flex items-center justify-center">
                                        <span className="mr-2 text-xl">✓</span> Onaylandı
                                    </div>
                                )}
                            </div>
                        ))
                    )
                )}

                {activeTab === 'owned' && (
                    myToys.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
                            <span className="text-5xl block mb-4">➕</span>
                            <p className="text-gray-500 font-bold">Henüz bir ilan eklemediniz.</p>
                            <button onClick={() => navigate('/ekle')} className="mt-4 text-blue-600 font-black text-sm">Hemen İlan Ver →</button>
                        </div>
                    ) : (
                        myToys.map(toy => (
                            <div key={toy.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm flex gap-4 items-center">
                                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0">
                                    {toy.imageUrl ? <img src={toy.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🧸</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-gray-900 truncate">{toy.name}</h3>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${toy.isAvailable ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>{toy.isAvailable ? 'Müsait' : 'Kirada'}</span>
                                    </div>
                                    <p className="text-xs font-bold text-blue-600 mt-1">₺{toy.price}/gün</p>
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => navigate(`/oyuncak/${toy.id}/duzenle`)} className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-xl font-bold text-[10px] border border-gray-100">Düzenle</button>
                                        <button onClick={() => handleDelete(toy.id)} className="flex-1 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-[10px] border border-red-50">Sil</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )
                )}
            </div>
        </div>
    );
}
