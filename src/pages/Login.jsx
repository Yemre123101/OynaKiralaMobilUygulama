import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

    // Email state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Phone state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [showVerificationInput, setShowVerificationInput] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);

    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err) {
            handleError(err);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            navigate('/');
        } catch (err) {
            handleError(err);
        }
    };

    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    // reCAPTCHA solved
                },
                'expired-callback': () => {
                    // Response expired
                }
            });
        }
    };

    const handlePhoneLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phoneNumber || phoneNumber.length < 10) {
            setError('Geçerli bir telefon numarası giriniz (+90...)');
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
            case 'auth/configuration-not-found':
            case 'auth/admin-restricted-operation':
            case 'auth/operation-not-allowed':
                errorMessage = "HATA: Bu giriş yöntemi Firebase Console'da etkinleştirilmemiş.";
                break;
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
            case 'auth/wrong-password':
                errorMessage = "Hatalı şifre.";
                break;
            case 'auth/weak-password':
                errorMessage = "Şifre çok zayıf (en az 6 karakter olmalı).";
                break;
            case 'auth/invalid-verification-code':
                errorMessage = "Doğrulama kodu hatalı.";
                break;
            default:
                errorMessage = err.message;
        }
        setError(errorMessage);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                    </h2>

                    {/* Method Toggle Buttons */}
                    <div className="mt-4 flex justify-center space-x-4">
                        <button
                            onClick={() => { setLoginMethod('email'); setError(''); }}
                            className={`pb-2 text-sm font-medium border-b-2 ${loginMethod === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Email
                        </button>
                        <button
                            onClick={() => { setLoginMethod('phone'); setError(''); }}
                            className={`pb-2 text-sm font-medium border-b-2 ${loginMethod === 'phone' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Telefon
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                {/* EMAIL FORM */}
                {loginMethod === 'email' && (
                    <form className="mt-8 space-y-6" onSubmit={handleEmailSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <div>
                                <label className="sr-only">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Email adresi"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="sr-only">Şifre</label>
                                <input
                                    type="password"
                                    required
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    placeholder="Şifre"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md"
                        >
                            {isLogin ? 'Email ile Giriş Yap' : 'Email ile Kayıt Ol'}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm text-blue-600 hover:text-blue-500"
                            >
                                {isLogin ? 'Hesabın yok mu? Kayıt Ol' : 'Zaten hesabın var mı? Giriş Yap'}
                            </button>
                        </div>
                    </form>
                )}

                {/* PHONE FORM */}
                {loginMethod === 'phone' && (
                    <form className="mt-8 space-y-6" onSubmit={showVerificationInput ? verifyPhoneCode : handlePhoneLogin}>
                        {!showVerificationInput ? (
                            <div className="rounded-md shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon Numarası</label>
                                    <input
                                        type="tel"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="5XX XXX XX XX"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Başında 0 olmadan giriniz (Örn: 5321234567)</p>
                                </div>
                                <div id="recaptcha-container" className="flex justify-center"></div>
                            </div>
                        ) : (
                            <div className="rounded-md shadow-sm space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SMS Kodu</label>
                                    <input
                                        type="text"
                                        required
                                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        placeholder="123456"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md"
                        >
                            {showVerificationInput ? 'Kodu Doğrula' : 'SMS Gönder'}
                        </button>
                    </form>
                )}

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">veya</span>
                    </div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                    <img className="h-5 w-5 mr-3" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />
                    Google ile Devam Et
                </button>
            </div>
        </div>
    );
}
