import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ToyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toy, setToy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchToy = async () => {
            try {
                const docRef = doc(db, "toys", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setToy({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No such toy!");
                }
            } catch (error) {
                console.error("Error fetching toy:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchToy();
    }, [id]);

    const startChat = async () => {
        if (!currentUser) return alert("Giriş yapmalısınız!");
        if (currentUser.uid === toy.ownerId) return alert("Kendi oyuncağınız için sohbet başlatamazsınız!");

        const roomId = [currentUser.uid, toy.ownerId].sort().join("_");
        const roomRef = doc(db, "rooms", roomId);

        try {
            await setDoc(roomRef, {
                participants: [currentUser.uid, toy.ownerId],
                toyId: toy.id,
                toyName: toy.name,
                lastMessage: "İlan hakkında bilgi almak istiyorum.",
                updatedAt: serverTimestamp()
            }, { merge: true });

            navigate(`/sohbet/${roomId}`);
        } catch (error) {
            console.error("Chat error:", error);
        }
    };

    const rentToy = async () => {
        if (!currentUser) {
            alert("Lütfen giriş yapın!");
            return;
        }

        try {
            const toyRef = doc(db, "toys", id);
            await updateDoc(toyRef, {
                isAvailable: false,
                rentedBy: currentUser.uid,
                rentedAt: serverTimestamp()
            });
            alert("Oyuncak başarıyla kiralandı!");
            navigate('/');
        } catch (error) {
            console.error("Error renting toy:", error);
            alert("Kiralama sırasında bir hata oluştu.");
        }
    };

    if (loading) return <div className="p-4 text-center">Yükleniyor...</div>;
    if (!toy) return <div className="p-4 text-center">Oyuncak bulunamadı.</div>;

    const isOwner = currentUser && currentUser.uid === toy.ownerId;

    return (
        <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Geri Dön
            </button>

            {/* Image Section */}
            <div className="bg-gray-100 rounded-3xl overflow-hidden aspect-video w-full mb-6 shadow-sm border border-gray-100">
                {toy.imageUrl ? (
                    <img src={toy.imageUrl} alt={toy.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-200">
                        🧸
                    </div>
                )}
            </div>

            {/* Categories */}
            {toy.categories && toy.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {toy.categories.map(cat => (
                        <span key={cat} className="bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-100">
                            {cat}
                        </span>
                    ))}
                </div>
            )}

            {/* Title & Details */}
            <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-black text-gray-900 leading-tight">{toy.name}</h1>
                <div className="text-right">
                    <p className="text-2xl font-black text-blue-600">₺{toy.price}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Günlük</p>
                </div>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-500 mb-8 font-medium">
                <span className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="mr-2">🎂</span> {toy.ageRange} Yaş
                </span>
                <span className="flex items-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <span className="mr-2">📍</span> {toy.city}
                </span>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center">
                    <span className="w-1 h-4 bg-blue-600 rounded-full mr-2"></span>
                    Açıklama
                </h3>
                <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-2xl">
                    {toy.description || "Bu oyuncak için henüz açıklama girilmemiş."}
                </p>
            </div>

            {/* Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-lg border-t border-gray-100 z-40 max-w-md mx-auto">
                <div className="flex gap-3">
                    {!isOwner && (
                        <button
                            onClick={startChat}
                            className="flex-1 bg-white border-2 border-blue-600 text-blue-600 py-3.5 rounded-2xl font-black text-sm hover:bg-blue-50 transition-all flex items-center justify-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Sohbet Et</span>
                        </button>
                    )}

                    {toy.isAvailable ? (
                        <button
                            onClick={rentToy}
                            disabled={isOwner}
                            className={`flex-[1.5] py-4 rounded-2xl font-black text-sm shadow-lg transition-all ${isOwner ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}
                        >
                            {isOwner ? 'Senin Oyuncağın' : 'Hemen Kirala'}
                        </button>
                    ) : (
                        <button disabled className="flex-[1.5] bg-orange-100 text-orange-600 py-4 rounded-2xl font-black text-sm cursor-not-allowed">
                            Şu An Kirada
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
