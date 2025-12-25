import { useState } from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
    selectedLanguage: string;
    onLanguageChange: (lang: string) => void;
}

const LANGUAGES = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' }
];

export default function LanguageSelector({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    const selectedLang = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-xl text-sm text-white hover:bg-white/5 transition-all"
            >
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs">{selectedLang.flag}</span>
                <span className="hidden sm:inline">{selectedLang.name}</span>
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute right-0 top-full mt-2 bg-[#1a1a1e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[160px]">
                        <div className="p-2 border-b border-white/10">
                            <span className="text-xs text-white/40 px-2">Select Language</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        onLanguageChange(lang.code);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-white/5 transition-colors ${
                                        selectedLanguage === lang.code ? 'bg-green-500/10 text-green-400' : 'text-white'
                                    }`}
                                >
                                    <span>{lang.flag}</span>
                                    <span className="text-sm">{lang.name}</span>
                                    {selectedLanguage === lang.code && (
                                        <span className="ml-auto text-green-400">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 border-t border-white/10 bg-black/20">
                            <span className="text-[10px] text-white/30 px-2">
                                🌾 For Indian Farmers
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
