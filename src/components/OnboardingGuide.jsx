import { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Home,
    MessageCircle,
    PlusCircle,
    ShoppingBag,
    User,
    Info,
    CheckCircle2,
    Filter
} from 'lucide-react';

export default function OnboardingGuide({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const steps = [
        {
            title: "Oyna-Kirala'ya Hoş Geldin! ✨",
            description: "Çocukların için yeni oyuncaklar keşfetmek, paylaşmak ve aile bütçesine katkıda bulunmak için en doğru yerdesin. Hadi, seni gezdirelim!",
            icon: <Sparkles className="w-16 h-16 text-blue-500" />,
            color: "bg-blue-50",
            buttonLabel: "Hadi Başlayalım!"
        },
        {
            title: "Ana Sayfa ve Keşfet",
            description: "Burada yüzlerce oyuncağı görebilirsin. Üstteki arama çubuğuyla istediğini bul, filtre ikonuyla yaş ve fiyata göre daralt!",
            icon: <div className="relative">
                <Home className="w-16 h-16 text-purple-500" />
                <Filter className="w-6 h-6 text-purple-300 absolute -bottom-1 -right-1" />
            </div>,
            color: "bg-purple-50",
            details: ["Arama Çubuğu", "Detaylı Filtreleme", "Şehrindeki Oyuncaklar"]
        },
        {
            title: "Oyuncak Detayları",
            description: "Bir oyuncağa tıkladığında; fotoğraflarını, günlük fiyatını ve açıklamasını görürsün. 'Hemen Kirala' butonuyla işlemi başlatabilirsin.",
            icon: <Info className="w-16 h-16 text-green-500" />,
            color: "bg-green-50",
            details: ["Günlük Kira Ücreti", "Yaş Uygunluğu", "Güvenli Kiralama Sistemi"]
        },
        {
            title: "Sohbet ve İletişim",
            description: "Oyuncak sahipleriyle doğrudan mesajlaşabilirsin. Kiralama öncesi sorularını sor, teslimat için detayları konuş.",
            icon: <MessageCircle className="w-16 h-16 text-orange-500" />,
            color: "bg-orange-50",
            details: ["Gerçek Zamanlı Mesajlaşma", "Sahibine Soru Sor", "Teslimat Koordinasyonu"]
        },
        {
            title: "Yeni Oyuncak Ekle",
            description: "Evin köşe bucağında bekleyen oyuncakları kazanca dönüştür! Fotoğraf çek, fiyatını belirle ve yayınla.",
            icon: <PlusCircle className="w-16 h-16 text-pink-500" />,
            color: "bg-pink-50",
            details: ["Hızlı İlan Oluşturma", "Fiyat Belirleme", "Sürdürülebilir Paylaşım"]
        },
        {
            title: "Kiralamalarım",
            description: "Şu an elinde olan veya geçmişte kiraladığın tüm oyuncakları buradan takip edebilir, iade sürelerini kontrol edebilirsin.",
            icon: <ShoppingBag className="w-16 h-16 text-indigo-500" />,
            color: "bg-indigo-50",
            details: ["Aktif Kiralamalar", "Geçmiş İşlemler", "Süre Takibi"]
        },
        {
            title: "Profil ve Ayarlar",
            description: "Bilgilerini güncelle, IBAN numaranı kaydet ve hesabını yönet.",
            icon: <User className="w-16 h-16 text-teal-500" />,
            color: "bg-teal-50",
            details: ["Kişisel Bilgiler", "IBAN ve Ödeme Ayarları", "Hesap Güvenliği"]
        },
        {
            title: "Artık Hazırsın! 🎉",
            description: "Gezintimiz bitti. Şimdi çocukları sevindirme ve paylaşım topluluğunun bir parçası olma vakti!",
            icon: <CheckCircle2 className="w-16 h-16 text-green-600" />,
            color: "bg-green-100",
            buttonLabel: "Uygulamaya Başla"
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onComplete, 300);
    };

    const step = steps[currentStep];

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose}></div>

            <div className={`relative w-full max-w-sm bg-white rounded-[3rem] shadow-2xl overflow-hidden transition-all duration-500 transform ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>
                {/* Progress Bar */}
                <div className="flex h-1.5 bg-gray-100">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`flex-1 transition-all duration-700 ${idx <= currentStep ? 'bg-blue-600' : 'bg-transparent'}`}
                        />
                    ))}
                </div>

                <div className="p-8 pt-10">
                    <button
                        onClick={handleClose}
                        className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col items-center text-center">
                        <div className={`p-8 rounded-[2.5rem] ${step.color} mb-8 animate-float shadow-inner`}>
                            {step.icon}
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-4 px-2 leading-tight">
                            {step.title}
                        </h3>

                        <p className="text-gray-500 font-medium leading-relaxed px-2 mb-6">
                            {step.description}
                        </p>

                        {step.details && (
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                                {step.details.map((detail, i) => (
                                    <span key={i} className="bg-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border border-gray-100">
                                        {detail}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4">
                        {currentStep > 0 && currentStep < steps.length - 1 && (
                            <button
                                onClick={handleBack}
                                className="flex items-center justify-center w-14 h-14 rounded-2xl text-gray-400 hover:bg-gray-100 transition-all active:scale-90"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-95 group ${currentStep === 0 || currentStep === steps.length - 1 ? 'w-full' : ''}`}
                        >
                            <span className="text-sm">{step.buttonLabel || (currentStep === steps.length - 1 ? 'Başlayalım!' : 'Devam Et')}</span>
                            {currentStep < steps.length - 1 && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </div>

                <div className="pb-8 flex justify-center gap-2">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}} />
        </div>
    );
}
