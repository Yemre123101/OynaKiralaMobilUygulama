import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/imageUtils';

export default function Profile() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', content: '' });

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phoneNumber: '',
        photoURL: '',
        userFriendlyId: '',
        city: '',
        age: '',
        gender: '',
        iban: ''
    });

    useEffect(() => {
        if (currentUser) {
            loadUserProfile();
        }
    }, [currentUser]);

    const loadUserProfile = async () => {
        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();

                // Generate ID if missing
                if (!data.userFriendlyId) {
                    const newId = Math.floor(100000 + Math.random() * 900000).toString();
                    await setDoc(docRef, { userFriendlyId: newId }, { merge: true });
                    data.userFriendlyId = newId;
                }

                setFormData({
                    displayName: data.displayName || currentUser.displayName || '',
                    email: data.email || currentUser.email || '',
                    phoneNumber: data.phoneNumber || currentUser.phoneNumber || '',
                    photoURL: data.photoURL || currentUser.photoURL || '',
                    userFriendlyId: data.userFriendlyId || '',
                    city: data.city || '',
                    age: data.age || '',
                    gender: data.gender || '',
                    iban: data.iban || ''
                });
            } else {
                // Initialize new profile
                const newId = Math.floor(100000 + Math.random() * 900000).toString();
                const initialData = {
                    displayName: currentUser.displayName || '',
                    email: currentUser.email || '',
                    phoneNumber: currentUser.phoneNumber || '',
                    photoURL: currentUser.photoURL || '',
                    userFriendlyId: newId,
                    city: '',
                    age: '',
                    gender: '',
                    iban: ''
                };
                await setDoc(docRef, initialData, { merge: true });
                setFormData(initialData);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            setMessage({ type: 'error', content: 'Profil bilgileri yüklenemedi.' });
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setMessage({ type: '', content: 'Fotoğraf işleniyor ve yükleniyor...' });

        try {
            let uploadFile = file;
            try {
                uploadFile = await compressImage(file, 400, 0.5);
            } catch (compError) {
                console.warn("Compression failed, using original:", compError);
            }

            const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
            await uploadBytes(storageRef, uploadFile);
            const url = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, photoURL: url }));
            setMessage({ type: 'success', content: 'Fotoğraf yüklendi. Kaydetmeyi unutmayın.' });
        } catch (error) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', content: 'Fotoğraf yüklenirken hata oluştu: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Çıkış hatası:", error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            // 1. Update Firestore
            await setDoc(doc(db, "users", currentUser.uid), {
                ...formData,
                updatedAt: new Date()
            }, { merge: true });

            // 2. Update Auth Profile
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                });

                if (auth.currentUser.email !== formData.email && formData.email) {
                    try {
                        await updateEmail(auth.currentUser, formData.email);
                    } catch (error) {
                        console.warn("Email update error:", error);
                        setMessage({ type: 'warning', content: 'Profil güncellendi ama email değiştirilemedi (yeniden giriş gerekli).' });
                        setLoading(false);
                        setIsEditing(false);
                        return;
                    }
                }
            }

            setMessage({ type: 'success', content: 'Profil başarıyla güncellendi!' });
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            setMessage({ type: 'error', content: 'Güncelleme hatası.' });
        } finally {
            setLoading(false);
        }
    };

    if (!currentUser) return <div className="p-4 text-center">Giriş yapılmalı.</div>;

    // Helper to get initials safely
    const getInitials = () => {
        const name = formData.displayName || formData.email || '?';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="p-4 pb-20 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Profilim</h1>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">

                {/* Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl overflow-hidden shadow-inner mb-3">
                        {formData.photoURL ? (
                            <img src={formData.photoURL} alt="Profil" className="h-full w-full object-cover" />
                        ) : (
                            <span>{getInitials()}</span>
                        )}
                    </div>

                    {!isEditing && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">{formData.displayName || 'İsimsiz Kullanıcı'}</h2>
                            <p className="text-sm text-gray-500">{formData.email}</p>
                            {(formData.city || formData.age) && (
                                <p className="text-sm text-gray-400 mt-1">
                                    {formData.city} {formData.age ? `• ${formData.age} Yaş` : ''}
                                </p>
                            )}

                            {formData.userFriendlyId && (
                                <div className="mt-2 bg-blue-50 px-4 py-1 rounded-full border border-blue-100">
                                    <p className="text-xs text-blue-600 font-medium">
                                        Kullanıcı ID: <span className="font-bold text-base select-all">{formData.userFriendlyId}</span>
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {message.content && (
                    <div className={`p-3 rounded-lg text-sm text-center mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-600' :
                        message.type === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-red-50 text-red-600'
                        }`}>
                        {message.content}
                    </div>
                )}

                {isEditing ? (
                    <form onSubmit={handleSave} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        {/* City, Age, Gender */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                            <select
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="">Şehir Seçiniz</option>
                                <option value="Adana">Adana</option>
                                <option value="Adıyaman">Adıyaman</option>
                                <option value="Afyonkarahisar">Afyonkarahisar</option>
                                <option value="Ağrı">Ağrı</option>
                                <option value="Amasya">Amasya</option>
                                <option value="Ankara">Ankara</option>
                                <option value="Antalya">Antalya</option>
                                <option value="Artvin">Artvin</option>
                                <option value="Aydın">Aydın</option>
                                <option value="Balıkesir">Balıkesir</option>
                                <option value="Bilecik">Bilecik</option>
                                <option value="Bingöl">Bingöl</option>
                                <option value="Bitlis">Bitlis</option>
                                <option value="Bolu">Bolu</option>
                                <option value="Burdur">Burdur</option>
                                <option value="Bursa">Bursa</option>
                                <option value="Çanakkale">Çanakkale</option>
                                <option value="Çankırı">Çankırı</option>
                                <option value="Çorum">Çorum</option>
                                <option value="Denizli">Denizli</option>
                                <option value="Diyarbakır">Diyarbakır</option>
                                <option value="Edirne">Edirne</option>
                                <option value="Elazığ">Elazığ</option>
                                <option value="Erzincan">Erzincan</option>
                                <option value="Erzurum">Erzurum</option>
                                <option value="Eskişehir">Eskişehir</option>
                                <option value="Gaziantep">Gaziantep</option>
                                <option value="Giresun">Giresun</option>
                                <option value="Gümüşhane">Gümüşhane</option>
                                <option value="Hakkari">Hakkari</option>
                                <option value="Hatay">Hatay</option>
                                <option value="Isparta">Isparta</option>
                                <option value="Mersin">Mersin</option>
                                <option value="İstanbul">İstanbul</option>
                                <option value="İzmir">İzmir</option>
                                <option value="Kars">Kars</option>
                                <option value="Kastamonu">Kastamonu</option>
                                <option value="Kayseri">Kayseri</option>
                                <option value="Kırklareli">Kırklareli</option>
                                <option value="Kırşehir">Kırşehir</option>
                                <option value="Kocaeli">Kocaeli</option>
                                <option value="Konya">Konya</option>
                                <option value="Kütahya">Kütahya</option>
                                <option value="Malatya">Malatya</option>
                                <option value="Manisa">Manisa</option>
                                <option value="Kahramanmaraş">Kahramanmaraş</option>
                                <option value="Mardin">Mardin</option>
                                <option value="Muğla">Muğla</option>
                                <option value="Muş">Muş</option>
                                <option value="Nevşehir">Nevşehir</option>
                                <option value="Niğde">Niğde</option>
                                <option value="Ordu">Ordu</option>
                                <option value="Rize">Rize</option>
                                <option value="Sakarya">Sakarya</option>
                                <option value="Samsun">Samsun</option>
                                <option value="Siirt">Siirt</option>
                                <option value="Sinop">Sinop</option>
                                <option value="Sivas">Sivas</option>
                                <option value="Tekirdağ">Tekirdağ</option>
                                <option value="Tokat">Tokat</option>
                                <option value="Trabzon">Trabzon</option>
                                <option value="Tunceli">Tunceli</option>
                                <option value="Şanlıurfa">Şanlıurfa</option>
                                <option value="Uşak">Uşak</option>
                                <option value="Van">Van</option>
                                <option value="Yozgat">Yozgat</option>
                                <option value="Zonguldak">Zonguldak</option>
                                <option value="Aksaray">Aksaray</option>
                                <option value="Bayburt">Bayburt</option>
                                <option value="Karaman">Karaman</option>
                                <option value="Kırıkkale">Kırıkkale</option>
                                <option value="Batman">Batman</option>
                                <option value="Şırnak">Şırnak</option>
                                <option value="Bartın">Bartın</option>
                                <option value="Ardahan">Ardahan</option>
                                <option value="Iğdır">Iğdır</option>
                                <option value="Yalova">Yalova</option>
                                <option value="Karabük">Karabük</option>
                                <option value="Kilis">Kilis</option>
                                <option value="Osmaniye">Osmaniye</option>
                                <option value="Düzce">Düzce</option>
                            </select>
                        </div>
                        <div className="flex space-x-3">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                                <input
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cinsiyet</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Kadın">Kadın</option>
                                    <option value="Erkek">Erkek</option>
                                    <option value="Belirtmek İstemiyorum">Belirtmek İstemiyorum</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex flex-col space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Profil Fotoğrafı</label>
                            <div className="flex items-center space-x-4">
                                {formData.photoURL && (
                                    <img src={formData.photoURL} alt="Önizleme" className="h-12 w-12 rounded-full object-cover" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN (EFT için)</label>
                            <input
                                type="text"
                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                value={formData.iban}
                                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="flex-1 py-3 text-gray-700 bg-gray-100 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 py-3 text-white bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
                            >
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Şehir</span>
                                <span className="font-medium">{formData.city || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Yaş</span>
                                <span className="font-medium">{formData.age || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Cinsiyet</span>
                                <span className="font-medium">{formData.gender || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">Telefon</span>
                                <span className="font-medium">{formData.phoneNumber || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-gray-500">IBAN</span>
                                <span className="font-medium text-xs">{formData.iban || '-'}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-100 transition-colors"
                        >
                            Bilgileri Düzenle
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Çıkış Yap</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
