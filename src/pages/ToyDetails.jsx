import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, serverTimestamp, setDoc, addDoc, collection } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function ToyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [toy, setToy] = useState(null);
    const [owner, setOwner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRentalModal, setShowRentalModal] = useState(false);
    const [rentalDays, setRentalDays] = useState(7);
    const [paymentStep, setPaymentStep] = useState(1); // 1: Duration, 2: Method, 3: Details, 4: Renter Info, 5: Success
    const [paymentMode, setPaymentMode] = useState('card'); // 'card' or 'eft'
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
    const [senderName, setSenderName] = useState("");
    const [senderBank, setSenderBank] = useState("");

    useEffect(() => {
        const fetchToyAndOwner = async () => {
            try {
                const docRef = doc(db, "toys", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const toyData = { id: docSnap.id, ...docSnap.data() };
                    setToy(toyData);

                    // Fetch owner's IBAN
                    const ownerRef = doc(db, "users", toyData.ownerId);
                    const ownerSnap = await getDoc(ownerRef);
                    if (ownerSnap.exists()) {
                        setOwner(ownerSnap.data());
                    }
                } else {
                    console.log("No such toy!");
                }
            } catch (error) {
                console.error("Error fetching toy:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchToyAndOwner();
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

    const handleInitialRentClick = () => {
        if (!currentUser) {
            alert("Lütfen giriş yapın!");
            return;
        }
        setShowRentalModal(true);
        setPaymentStep(1);
    };

    const confirmPayment = async () => {
        try {
            setLoading(true);
            const toyRef = doc(db, "toys", id);

            // Create rental record
            await addDoc(collection(db, "rentals"), {
                toyId: toy.id,
                toyName: toy.name,
                renterId: currentUser.uid,
                ownerId: toy.ownerId,
                days: rentalDays,
                totalPrice: toy.price * rentalDays,
                senderName,
                senderBank,
                paymentMethod: paymentMode,
                cardLastFour: paymentMode === 'card' ? cardData.number.slice(-4) : null,
                createdAt: serverTimestamp()
            });

            // Update toy availability
            await updateDoc(toyRef, {
                isAvailable: false,
                rentedBy: currentUser.uid,
                rentedAt: serverTimestamp()
            });

            setPaymentStep(5);
        } catch (error) {
            console.error("Error renting toy:", error);
            alert("Kiralama sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && !toy) return <div className="p-4 text-center">Yükleniyor...</div>;
    if (!toy) return <div className="p-4 text-center">Oyuncak bulunamadı.</div>;

    const isOwner = currentUser && currentUser.uid === toy.ownerId;
    const totalPrice = toy.price * rentalDays;

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

            {/* Owner Info */}
            <div className="mb-8 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center text-sm">
                    🏠 Sahibi Hakkında
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-bold text-blue-700">{owner?.displayName || 'Gizli Kullanıcı'}</p>
                        <p className="text-xs text-blue-500">{owner?.city || toy.city}</p>
                    </div>
                    <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full bg-blue-200 border-2 border-white flex items-center justify-center text-xs">⭐</div>
                    </div>
                </div>
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
                            onClick={handleInitialRentClick}
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

            {/* Rental & Payment Modal */}
            {showRentalModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Kiralamayı Tamamla</h2>
                            <button onClick={() => setShowRentalModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {paymentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kiralama Süresi (Gün)</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[3, 7, 14, 30].map(d => (
                                            <button
                                                key={d}
                                                onClick={() => setRentalDays(d)}
                                                className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${rentalDays === d ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-500'}`}
                                            >
                                                {d} Gün
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        value={rentalDays}
                                        onChange={(e) => setRentalDays(parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer mt-6 accent-blue-600"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span>1 Gün</span>
                                        <span>{rentalDays} Gün Seçildi</span>
                                        <span>60 Gün</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 rounded-2xl space-y-2 border border-gray-100">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Günlük Ücret</span>
                                        <span className="font-bold">₺{toy.price}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Süre</span>
                                        <span className="font-bold">{rentalDays} Gün</span>
                                    </div>
                                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                        <span className="font-black text-gray-900">Toplam</span>
                                        <span className="text-xl font-black text-blue-600">₺{totalPrice}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setPaymentStep(2)}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                                >
                                    Ödeme Yöntemi Seç
                                </button>
                            </div>
                        )}

                        {paymentStep === 2 && (
                            <div className="space-y-4">
                                <p className="text-sm font-bold text-gray-500 mb-2">Ödeme Yöntemi</p>
                                <button
                                    onClick={() => setPaymentMode('card')}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMode === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
                                >
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">💳</span>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Kredi / Banka Kartı</p>
                                            <p className="text-xs text-gray-500 font-medium">Güvenli online ödeme</p>
                                        </div>
                                    </div>
                                    {paymentMode === 'card' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                                </button>

                                <button
                                    onClick={() => setPaymentMode('eft')}
                                    className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${paymentMode === 'eft' ? 'border-blue-600 bg-blue-50' : 'border-gray-100'}`}
                                >
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">🏦</span>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">EFT / Havale</p>
                                            <p className="text-xs text-gray-500 font-medium">Hesaba doğrudan transfer</p>
                                        </div>
                                    </div>
                                    {paymentMode === 'eft' && <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>}
                                </button>

                                <div className="pt-4 flex gap-3">
                                    <button onClick={() => setPaymentStep(1)} className="flex-1 py-4 text-gray-500 font-bold">Geri</button>
                                    <button onClick={() => setPaymentStep(3)} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black">Devam Et</button>
                                </div>
                            </div>
                        )}

                        {paymentStep === 3 && paymentMode === 'eft' && (
                            <div className="space-y-6">
                                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                                    <h4 className="text-orange-800 font-black text-sm mb-1 flex items-center">
                                        <span className="mr-2">🏦</span> EFT/Havale Bilgileri
                                    </h4>
                                    <p className="text-xs text-orange-700 leading-relaxed font-medium">
                                        Lütfen tutarı gönderdikten sonra bilgileri doldurmak için "Devam Et" butonuna basın.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alıcı Adı Soyadı</p>
                                        <p className="font-black text-gray-900">{owner?.displayName || 'Oyuncak Sahibi'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IBAN Numarası</p>
                                        <p className="font-black text-gray-900 break-all">{owner?.iban || 'TR00 0000 0000 0000 0000 0000 00'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setPaymentStep(2)} className="flex-1 py-4 text-gray-500 font-bold">Geri</button>
                                    <button onClick={() => setPaymentStep(4)} className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black">Devam Et</button>
                                </div>
                            </div>
                        )}

                        {paymentStep === 3 && paymentMode === 'card' && (
                            <div className="space-y-6">
                                {/* Card Graphic */}
                                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden h-44">
                                    <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl rotate-12">💳</div>
                                    <div className="relative z-10 h-full flex flex-col justify-between">
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-8 bg-yellow-400/50 rounded-md"></div>
                                            <p className="font-bold text-sm italic">PAY Card</p>
                                        </div>
                                        <p className="text-lg font-mono tracking-widest my-2">
                                            {cardData.number ? cardData.number.replace(/(.{4})/g, '$1 ') : '**** **** **** ****'}
                                        </p>
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-blue-100">
                                            <div>
                                                <p className="opacity-60 mb-0.5">Kart Sahibi</p>
                                                <p>{cardData.name || 'İSİM SOYİSİM'}</p>
                                            </div>
                                            <div>
                                                <p className="opacity-60 mb-0.5">Son Kullanma</p>
                                                <p>{cardData.expiry || 'MM/YY'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Kart Üzerindeki İsim"
                                        value={cardData.name}
                                        onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Kart Numarası"
                                        maxLength="16"
                                        value={cardData.number}
                                        onChange={(e) => setCardData({ ...cardData, number: e.target.value.replace(/\D/g, '') })}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold font-mono"
                                    />
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="AA/YY"
                                            maxLength="5"
                                            value={cardData.expiry}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.length > 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                                setCardData({ ...cardData, expiry: val });
                                            }}
                                            className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        />
                                        <input
                                            type="password"
                                            placeholder="CVC"
                                            maxLength="3"
                                            value={cardData.cvc}
                                            onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '') })}
                                            className="flex-1 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setPaymentStep(2)} className="flex-1 py-4 text-gray-500 font-bold">Geri</button>
                                    <button
                                        disabled={cardData.number.length < 16 || !cardData.name || cardData.expiry.length < 5 || cardData.cvc.length < 3}
                                        onClick={confirmPayment}
                                        className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg disabled:bg-gray-300"
                                    >
                                        {loading ? 'Ödeniyor...' : `₺${totalPrice} Öde`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentStep === 4 && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                    <h4 className="text-blue-800 font-black text-sm mb-1">✍️ Son Adım</h4>
                                    <p className="text-xs text-blue-700 font-medium">
                                        Kiralama işlemini başlatmak için adınızı ve varsa bankanızı onaylayın.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">Adınız Soyadınız</label>
                                        <input
                                            type="text"
                                            placeholder="Örn: Mehmet Yılmaz"
                                            value={senderName}
                                            onChange={(e) => setSenderName(e.target.value)}
                                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">Banka (EFT ise)</label>
                                        <input
                                            type="text"
                                            placeholder="Kartla ödediyseniz boş bırakabilirsiniz"
                                            value={senderBank}
                                            onChange={(e) => setSenderBank(e.target.value)}
                                            className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setPaymentStep(3)} className="flex-1 py-4 text-gray-500 font-black text-sm hover:bg-gray-50 rounded-2xl transition-all">Geri</button>
                                    <button
                                        onClick={confirmPayment}
                                        disabled={loading || !senderName}
                                        className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:bg-gray-400"
                                    >
                                        {loading ? 'İşleniyor...' : 'Ödemeyi Onayla'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {paymentStep === 5 && (
                            <div className="py-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl animate-bounce">
                                    ✓
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">Talebiniz Alındı!</h3>
                                    <p className="text-gray-500 font-medium mt-2">
                                        Ödemeniz onaylandığında oyuncak kiralama işlemi tamamlanacaktır. Sohbet üzerinden sahibiyle iletişime geçebilirsiniz.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/kiralamalarim')}
                                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                                >
                                    Kiralamalarımı Görüntüle
                                </button>
                                <button
                                    onClick={() => setShowRentalModal(false)}
                                    className="w-full text-gray-400 font-bold text-sm py-2"
                                >
                                    Kapat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
