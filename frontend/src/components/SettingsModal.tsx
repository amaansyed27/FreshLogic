import { useState, useEffect } from 'react';
import { X, Globe, Volume2, Moon, Sun, Check, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: AppSettings;
    onSettingsChange: (settings: AppSettings) => void;
}

export interface AppSettings {
    language: string;
    languageName: string;
    darkMode: boolean;
    soundEnabled: boolean;
    autoTranslate: boolean;
}

const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
];

export default function SettingsModal({ isOpen, onClose, settings, onSettingsChange }: SettingsModalProps) {
    const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
    const [showLanguageList, setShowLanguageList] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleLanguageSelect = (lang: typeof SUPPORTED_LANGUAGES[0]) => {
        setLocalSettings(prev => ({
            ...prev,
            language: lang.code,
            languageName: lang.name
        }));
        setShowLanguageList(false);
    };

    const handleSave = () => {
        onSettingsChange(localSettings);
        // Save to localStorage
        localStorage.setItem('freshlogic_settings', JSON.stringify(localSettings));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-[#1a1a1f] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Globe className="w-5 h-5 text-green-400" />
                            Settings
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-6">
                        {/* Language Selection */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <Languages className="w-4 h-4" />
                                Display Language
                            </label>
                            <div className="relative">
                                <button
                                    onClick={() => setShowLanguageList(!showLanguageList)}
                                    className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                                >
                                    <span className="text-white">
                                        {SUPPORTED_LANGUAGES.find(l => l.code === localSettings.language)?.native || 'English'} 
                                        <span className="text-gray-400 ml-2">
                                            ({localSettings.languageName})
                                        </span>
                                    </span>
                                    <Globe className="w-4 h-4 text-gray-400" />
                                </button>

                                <AnimatePresence>
                                    {showLanguageList && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-[#252530] border border-white/10 rounded-xl overflow-hidden shadow-xl z-10 max-h-64 overflow-y-auto"
                                        >
                                            {SUPPORTED_LANGUAGES.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => handleLanguageSelect(lang)}
                                                    className={`w-full flex items-center justify-between p-3 hover:bg-white/10 transition-colors ${
                                                        localSettings.language === lang.code ? 'bg-green-500/20' : ''
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-3">
                                                        <span className="text-white font-medium">{lang.native}</span>
                                                        <span className="text-gray-400 text-sm">{lang.name}</span>
                                                    </span>
                                                    {localSettings.language === lang.code && (
                                                        <Check className="w-4 h-4 text-green-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <p className="text-xs text-gray-500">
                                AI responses will be translated to your selected language
                            </p>
                        </div>

                        {/* Auto-Translate Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-lg">
                                    <Globe className="w-4 h-4 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">Auto-Translate Reports</p>
                                    <p className="text-gray-500 text-xs">Automatically translate AI analysis</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLocalSettings(prev => ({ ...prev, autoTranslate: !prev.autoTranslate }))}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    localSettings.autoTranslate ? 'bg-green-500' : 'bg-white/20'
                                }`}
                            >
                                <motion.div
                                    animate={{ x: localSettings.autoTranslate ? 24 : 2 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                />
                            </button>
                        </div>

                        {/* Sound Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                    <Volume2 className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">Sound Effects</p>
                                    <p className="text-gray-500 text-xs">Play sounds on notifications</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLocalSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    localSettings.soundEnabled ? 'bg-blue-500' : 'bg-white/20'
                                }`}
                            >
                                <motion.div
                                    animate={{ x: localSettings.soundEnabled ? 24 : 2 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                />
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    {localSettings.darkMode ? (
                                        <Moon className="w-4 h-4 text-purple-400" />
                                    ) : (
                                        <Sun className="w-4 h-4 text-yellow-400" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-medium text-sm">Dark Mode</p>
                                    <p className="text-gray-500 text-xs">Use dark theme (default)</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setLocalSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
                                className={`relative w-12 h-6 rounded-full transition-colors ${
                                    localSettings.darkMode ? 'bg-purple-500' : 'bg-white/20'
                                }`}
                            >
                                <motion.div
                                    animate={{ x: localSettings.darkMode ? 24 : 2 }}
                                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-white/10 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 rounded-xl text-white font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 py-2.5 px-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Check className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
