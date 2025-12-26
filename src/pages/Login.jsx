import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { loginAsGuest } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Additional User Info State (For Registration)
    const [city, setCity] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    // Phone state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Handle Google Redirect Result
    useEffect(() => {
        const handleRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const user = result.user;
                    const userRef = doc(db, "users", user.uid);
                    const userSnap = await getDoc(userRef);

                    if (!userSnap.exists()) {
                        await setDoc(userRef, {
                            email: user.email,
                            displayName: user.displayName || user.email.split('@')[0],
                            photoURL: user.photoURL || '',
                            city: '',
                            age: '',
                            gender: '',
                            iban: '',
                            createdAt: serverTimestamp(),
                            userFriendlyId: Math.floor(100000 + Math.random() * 900000).toString()
                        });
                    }
                    navigate('/');
                }
            } catch (err) {
                console.error("Redirect Error:", err);
                handleError(err);
            }
        };
        handleRedirect();
    }, [navigate]);

    const turkeyCities = [
        "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
    ];

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Registration
                if (!city || !age || !gender) {
                    setError('Lütfen tüm alanları doldurunuz (Şehir, Yaş, Cinsiyet).');
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Save additional info to Firestore
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    displayName: user.displayName || email.split('@')[0],
                    city: city,
                    age: age,
                    gender: gender,
                    createdAt: new Date(),
                    userFriendlyId: Math.floor(100000 + Math.random() * 900000).toString()
                });
            }
            navigate('/');
        } catch (err) {
            handleError(err);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            // Redirect is more reliable on mobile and bypasses COOP issues
            await signInWithRedirect(auth, provider);
        } catch (err) {
            handleError(err);
        }
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': (response) => {
                    // reCAPTCHA solved
                }
            });
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phoneNumber) {
            setError('Geçerli bir telefon numarası giriniz.');
            return;
        }

        try {
            setupRecaptcha();
            const appVerifier = window.recaptchaVerifier;
            const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+90${phoneNumber.replace(/^0/, '')}`;

            const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(confirmation);
            setShowVerificationInput(true);
        } catch (err) {
            console.error(err);
            handleError(err);
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        }
    };

    const verifyPhoneCode = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await confirmationResult.confirm(verificationCode);
            navigate('/');
        } catch (err) {
            handleError(err);
        }
    };

    const handleError = (err) => {
        console.error(err);
        let errorMessage = "Bir hata oluştu.";

        switch (err.code) {
            case 'auth/email-already-in-use':
                errorMessage = "Bu email adresi zaten kullanımda.";
                break;
            case 'auth/invalid-email':
                errorMessage = "Geçersiz email adresi.";
                break;
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                errorMessage = "Giriş bilgileri hatalı.";
                break;
            case 'auth/weak-password':
                errorMessage = "Şifre çok zayıf.";
                break;
            case 'auth/popup-closed-by-user':
                errorMessage = "Giriş penceresi kapatıldı.";
                break;
            case 'auth/cancelled-popup-request':
                errorMessage = "Giriş işlemi iptal edildi.";
                break;
            default:
                errorMessage = `Hata (${err.code}): ${err.message}`;
        }
        setError(errorMessage);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl mb-4 shadow-lg shadow-blue-200">
                        🧸
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                        {isLogin ? 'Hoş Geldiniz' : 'Aramıza Katılın'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 font-medium">
                        {isLogin ? 'Oyuncak dünyasına geri dön' : 'Kayıt ol ve keşfetmeye başla'}
                    </p>

                    <div className="mt-6 flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setLoginMethod('email'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            E-posta
                        </button>
                        <button
                            onClick={() => { setLoginMethod('phone'); setError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginMethod === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                        >
                            Telefon
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 animate-pulse">
                        {error}
                    </div>
                )}

                {loginMethod === 'email' && (
                    <form className="mt-8 space-y-4" onSubmit={handleEmailSubmit}>
                        <div className="space-y-3">
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                                placeholder="E-posta adresi"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                                placeholder="Şifre"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            {!isLogin && (
                                <div className="space-y-3 pt-2">
                                    <div className="h-px bg-gray-100 my-4"></div>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Profil Bilgileri</p>
                                    <select
                                        required
                                        className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    >
                                        <option value="">Şehir Seçiniz</option>
                                        {turkeyCities.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            required
                                            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                            placeholder="Yaş"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                        />
                                        <select
                                            required
                                            className="flex-1 px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium appearance-none"
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                        >
                                            <option value="">Cinsiyet</option>
                                            <option value="Kadın">Kadın</option>
                                            <option value="Erkek">Erkek</option>
                                            <option value="Belirtmek İstemiyorum">Diğer</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
                        >
                            {isLogin ? 'Giriş Yap' : 'Hesabımı Oluştur'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="w-full text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            {isLogin ? 'Henüz hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
                        </button>
                    </form>
                )}

                {loginMethod === 'phone' && (
                    <form className="mt-8 space-y-4" onSubmit={showVerificationInput ? verifyPhoneCode : handlePhoneLogin}>
                        {!showVerificationInput ? (
                            <div className="space-y-4">
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                                    placeholder="5XX XXX XX XX"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                                <div id="recaptcha-container"></div>
                                <button
                                    type="submit"
                                    className="w-full py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-100"
                                >
                                    Kod Gönder
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder-gray-400 font-medium"
                                    placeholder="Doğrulama Kodu"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="w-full py-4 px-4 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl shadow-lg shadow-green-100"
                                >
                                    Doğrula ve Giriş Yap
                                </button>
                            </div>
                        )}
                    </form>
                )}

                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-100"></div>
                    </div>
                    <div className="relative flex justify-center text-xs font-black text-gray-300 uppercase tracking-widest bg-white px-4 mx-auto w-fit">
                        Veya
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center px-4 py-3.5 border-2 border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-[0.98] mb-3"
                >
                    <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Google ile devam et
                </button>

                <button
                    onClick={() => {
                        loginAsGuest();
                        navigate('/');
                    }}
                    className="w-full flex items-center justify-center px-4 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-[0.98]"
                >
                    Misafir Olarak Gözat 🕵️
                </button>
            </div>
        </div>
    );
}
