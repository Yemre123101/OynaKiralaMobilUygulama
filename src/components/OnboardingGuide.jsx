import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Layout, Sparkles, MessageCircle, ShieldCheck } from 'lucide-react';

export default function OnboardingGuide({ onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const steps = [
        {
            title: "Oyna-Kirala'ya Hoş Geldiniz!",
            description: "Çocuklarınızın oyun dünyasını sürdürülebilir ve ekonomik bir şekilde büyütmeye hazır mısınız?",
            icon: <Sparkles className="w-12 h-12 text-blue-500" />,
            color: "bg-blue-50"
        },
        {
            title: "Oyuncaklarını Paylaş",
            description: "Kullanılmayan oyuncakları sisteme yükle, hem evinde yer aç hem de bütçene katkıda bulun.",
            icon: <Layout className="w-12 h-12 text-purple-500" />,
            color: "bg-purple-50"
        },
        {
            title: "Keşfet ve Kirala",
            description: "Yüzlerce kaliteli oyuncak arasından dilediğini seç, uygun fiyatlarla kirala ve çocuklarını sevindir.",
            icon: <ShieldCheck className="w-12 h-12 text-green-500" />,
            color: "bg-green-50"
        },
        {
            title: "Güvenli İletişim",
            description: "Sohbet özelliği sayesinde diğer ebeveynlerle iletişime geç, oyuncaklar hakkında bilgi al.",
            icon: <MessageCircle className="w-12 h-12 text-orange-500" />,
            color: "bg-orange-50"
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

    if (!isVisible && currentStep === 0) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose}></div>

            <div className={`relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden transition-transform duration-300 ${isVisible ? 'scale-100' : 'scale-95'}`}>
                {/* Progress Bar */}
                <div className="flex h-1.5 bg-gray-100">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-blue-600' : 'bg-transparent'}`}
                        />
                    ))}
                </div>

                <div className="p-8">
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <div className="mt-4 flex flex-col items-center text-center">
                        <div className={`p-6 rounded-[2rem] ${steps[currentStep].color} mb-8 animate-bounce-subtle`}>
                            {steps[currentStep].icon}
                        </div>

                        <h3 className="text-2xl font-black text-gray-900 mb-4 px-2">
                            {steps[currentStep].title}
                        </h3>

                        <p className="text-gray-500 font-medium leading-relaxed px-4">
                            {steps[currentStep].description}
                        </p>
                    </div>

                    <div className="mt-12 flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`flex items-center justify-center w-14 h-14 rounded-2xl transition-all ${currentStep === 0 ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            onClick={handleNext}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-100 flex items-center justify-center gap-2 transition-all active:scale-95 group"
                        >
                            {currentStep === steps.length - 1 ? 'Başlayalım!' : 'Devam Et'}
                            {currentStep < steps.length - 1 && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </div>

                <div className="pb-6 flex justify-center gap-1.5">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-blue-600' : 'bg-gray-200'}`}
                        />
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
            `}} />
        </div>
    );
}
