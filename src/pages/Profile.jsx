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
        photoURL: ''
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
                setFormData({ ...docSnap.data() });
            } else {
                setFormData({
                    displayName: currentUser.displayName || '',
                    email: currentUser.email || '',
                    phoneNumber: currentUser.phoneNumber || '',
                    photoURL: currentUser.photoURL || ''
                });
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setLoading(true);
        setMessage({ type: '', content: 'Fotoğraf işleniyor ve yükleniyor...' });

        try {
            const compressedFile = await compressImage(file, 200, 0.7); // Smaller max width for profile pics
            const storageRef = ref(storage, `profile_images/${currentUser.uid}`);
            await uploadBytes(storageRef, compressedFile);
            const url = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, photoURL: url }));
            setMessage({ type: 'success', content: 'Fotoğraf yüklendi. Kaydetmeyi unutmayın.' });
        } catch (error) {
            console.error("Upload error:", error);
            setMessage({ type: 'error', content: 'Fotoğraf yüklenirken hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Çıkış yapılırken hata oluştu:", error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', content: '' });

        try {
            // 1. Update Firestore (Primary storage for app profile)
            await setDoc(doc(db, "users", currentUser.uid), {
                displayName: formData.displayName,
                email: formData.email,
                phoneNumber: formData.phoneNumber,
                photoURL: formData.photoURL,
                updatedAt: new Date()
            }, { merge: true });

            // 2. Attempt to update Auth Profile (Best effort)
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, {
                    displayName: formData.displayName,
                    photoURL: formData.photoURL
                });

                // Update email if changed (Sensitive operation)
                if (auth.currentUser.email !== formData.email && formData.email) {
                    try {
                        await updateEmail(auth.currentUser, formData.email);
                    } catch (emailError) {
                        console.warn("Email update requires recent login:", emailError);
                        setMessage({
                            type: 'warning',
                            content: 'Profil güncellendi fakat email değişikliği için yeniden giriş yapmanız gerekebilir.'
                        });
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
            setMessage({ type: 'error', content: 'Güncelleme sırasında bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 pb-20 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Profilim</h1>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">

                {/* Profile Header / Avatar */}
                <div className="flex flex-col items-center mb-6">
                    <div className="h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-3xl overflow-hidden shadow-inner mb-3">
                        {formData.photoURL ? (
                            <img src={formData.photoURL} alt="Profil" className="h-full w-full object-cover" />
                        ) : (
                            <span>{formData.displayName?.charAt(0).toUpperCase() || formData.email?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    {!isEditing && (
                        <>
                            <h2 className="text-xl font-bold text-gray-900">{formData.displayName || 'İsimsiz Kullanıcı'}</h2>
                            <p className="text-sm text-gray-500">{formData.email}</p>
                        </>
                    )}
                </div>

                {message.content && (
                    <div className={`p-3 rounded-lg text-sm text-center mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-600' :
                        message.type === 'warning' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
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
                                placeholder="Adınız Soyadınız"
                            />
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
                                    className="block w-full text-sm text-slate-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-blue-50 file:text-blue-700
                                    hover:file:bg-blue-100
                                    "
                                />
                            </div>
                            <p className="text-xs text-gray-500">JPG, PNG formatında yükleyeyebilirsiniz.</p>
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
                                placeholder="05XX XXX XX XX"
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
                                <span className="text-gray-500">Telefon</span>
                                <span className="font-medium">{formData.phoneNumber || '-'}</span>
                            </div>
                            {/* Diğer salt okunur bilgiler buraya eklenebilir */}
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
