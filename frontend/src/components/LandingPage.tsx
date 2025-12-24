import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Truck, Search, MapPin, TrendingUp } from "lucide-react";
import clsx from "clsx";
import { CROP_LIST } from "../constants/crops";

interface LandingPageProps {
    onStart: (mode: string, query: string, manualInputs?: any) => void;
    initialInputs?: any;
}

export default function LandingPage({ onStart }: LandingPageProps) {
    const [inputType, setInputType] = useState<'text' | 'manual' | 'yield'>('manual');
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // Manual inputs state
    const [manualData, setManualData] = useState({
        origin: 'Nashik',
        destination: 'Mumbai',
        crop: 'Strawberry'
    });

    // Parallax mouse effect
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX - window.innerWidth / 2) / 50,
                y: (e.clientY - window.innerHeight / 2) / 50,
            });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (inputType === 'text') {
            if (!query.trim()) return;
            // Extract info from query for context
            const extractedData = extractFromQuery(query);
            onStart('route', query, extractedData);
        } else {
            // Manual Mode
            if (!manualData.origin.trim() || !manualData.destination.trim()) {
                return;
            }
            const generatedQuery = `Optimize route from ${manualData.origin} to ${manualData.destination} for ${manualData.crop}`;
            onStart('route', generatedQuery, manualData);
        }
    };

    // Simple extraction from natural language query
    const extractFromQuery = (q: string): any => {
        const lower = q.toLowerCase();
        let extracted = { ...manualData };

        // Try to find crop mentions
        for (const crop of CROP_LIST) {
            const cropLower = crop.toLowerCase();
            const simpleName = cropLower.split('(')[0].trim();
            if (lower.includes(simpleName) || lower.includes(cropLower)) {
                extracted.crop = crop;
                break;
            }
        }

        // Simple "from X to Y" pattern
        const fromToMatch = q.match(/from\s+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+for|\s*$)/i);
        if (fromToMatch) {
            extracted.origin = fromToMatch[1].trim();
            extracted.destination = fromToMatch[2].trim();
        }

        return extracted;
    };

    return (
        <div className="relative h-screen w-screen overflow-hidden flex flex-col items-center justify-center text-white">

            {/* Background Parallax Elements */}
            <motion.div
                className="absolute inset-0 pointer-events-none z-0"
                style={{ x: mousePosition.x, y: mousePosition.y }}
            >
                <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-green-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px]" />
            </motion.div>

            {/* Main Content */}
            <div className="z-10 w-full max-w-3xl px-6 flex flex-col items-center gap-8">

                {/* Logo / Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="flex items-center gap-3 justify-center mb-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg shadow-green-900/20">
                            <Truck className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                        FreshLogic
                    </h1>
                    <p className="mt-4 text-lg text-white/50 font-light">
                        AI-powered supply chain optimization for perishables.
                    </p>
                </motion.div>

                {/* Input Method Toggle */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-2 text-sm font-medium text-white/50 bg-white/5 p-1.5 rounded-xl border border-white/10"
                >
                    <button
                        onClick={() => setInputType('manual')}
                        className={clsx(
                            "px-5 py-2 rounded-lg transition-all flex items-center gap-2",
                            inputType === 'manual' ? "bg-white/10 text-white shadow-sm border border-white/10" : "hover:text-white/80"
                        )}
                    >
                        <MapPin className="w-4 h-4" />
                        Select Route
                    </button>
                    <button
                        onClick={() => setInputType('text')}
                        className={clsx(
                            "px-5 py-2 rounded-lg transition-all flex items-center gap-2",
                            inputType === 'text' ? "bg-white/10 text-white shadow-sm border border-white/10" : "hover:text-white/80"
                        )}
                    >
                        <Search className="w-4 h-4" />
                        Natural Language
                    </button>
                    <button
                        onClick={() => setInputType('yield')}
                        className={clsx(
                            "px-5 py-2 rounded-lg transition-all flex items-center gap-2 relative",
                            inputType === 'yield' ? "bg-white/10 text-white shadow-sm border border-white/10" : "hover:text-white/80 opacity-50 cursor-not-allowed"
                        )}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Yield Prediction
                        <span className="absolute -top-2 -right-2 text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded-full border border-yellow-500/30">
                            Soon
                        </span>
                    </button>
                </motion.div>

                {/* Input Area */}
                {inputType === 'text' && (
                    <motion.form
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onSubmit={handleSubmit}
                        className={clsx(
                            "w-full relative transition-all duration-500",
                            isFocused ? "scale-[1.02]" : "scale-100"
                        )}
                    >
                        <div className={clsx(
                            "absolute inset-0 rounded-2xl transition-all duration-500",
                            isFocused ? "bg-green-500/10 blur-xl" : "bg-transparent"
                        )} />

                        <div className="glass-input rounded-2xl p-2 flex items-center gap-3 pr-2 overflow-hidden relative z-10 transition-all border border-white/10 focus-within:border-green-500/30">
                            <Search className="w-6 h-6 text-white/40 ml-4" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="e.g., 'Analyze strawberry shipment from Nashik to Delhi'"
                                className="w-full bg-transparent border-none outline-none text-lg placeholder:text-white/30 py-4"
                            />

                            <button
                                type="submit"
                                disabled={!query.trim()}
                                className={clsx(
                                    "p-3 rounded-xl transition-all duration-300 flex items-center justify-center",
                                    query.trim()
                                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 active:scale-95 cursor-pointer shadow-lg shadow-green-900/30"
                                        : "bg-white/5 text-white/20 cursor-not-allowed"
                                )}
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.form>
                )}

                {/* Manual Route Selection */}
                {inputType === 'manual' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-5"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Origin - Text Input */}
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase tracking-wider font-medium pl-1 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    Origin City
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500/50 placeholder:text-white/20 transition-colors"
                                    placeholder="e.g., Nashik"
                                    value={manualData.origin}
                                    onChange={(e) => setManualData({ ...manualData, origin: e.target.value })}
                                />
                            </div>

                            {/* Destination - Text Input */}
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase tracking-wider font-medium pl-1 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    Destination City
                                </label>
                                <input
                                    type="text"
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/40 placeholder:text-white/20 transition-colors"
                                    placeholder="e.g., Mumbai"
                                    value={manualData.destination}
                                    onChange={(e) => setManualData({ ...manualData, destination: e.target.value })}
                                />
                            </div>

                            {/* Crop - Full Dropdown */}
                            <div className="space-y-2">
                                <label className="text-xs text-white/40 uppercase tracking-wider font-medium pl-1 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                    Crop Type
                                </label>
                                <select
                                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-yellow-500/50 cursor-pointer transition-colors"
                                    value={manualData.crop}
                                    onChange={(e) => setManualData({ ...manualData, crop: e.target.value })}
                                >
                                    {CROP_LIST.map(crop => (
                                        <option key={crop} value={crop} className="bg-[#0f0f12] text-white py-2">
                                            {crop}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!manualData.origin.trim() || !manualData.destination.trim()}
                            className={clsx(
                                "w-full font-medium py-3.5 rounded-xl transition-all shadow-lg mt-2 flex items-center justify-center gap-2",
                                manualData.origin.trim() && manualData.destination.trim()
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-[1.01] active:scale-[0.99] shadow-green-900/30"
                                    : "bg-white/5 text-white/30 cursor-not-allowed"
                            )}
                        >
                            <Truck className="w-5 h-5" />
                            Analyze Route
                        </button>
                    </motion.div>
                )}

                {/* Yield Prediction - Coming Soon */}
                {inputType === 'yield' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center gap-4 opacity-60"
                    >
                        <div className="p-4 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                            <TrendingUp className="w-10 h-10 text-yellow-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white/80">Yield Prediction</h3>
                        <p className="text-white/40 text-center max-w-md text-sm">
                            Predict crop yields based on weather patterns, soil conditions, and historical data. 
                            This feature is currently under development.
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-yellow-400/80 text-sm">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                            Coming Soon
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs text-white/30 w-full max-w-sm">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-white/50 mb-1">📊</div>
                                Historical Data
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-white/50 mb-1">🌤️</div>
                                Weather Analysis
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="text-white/50 mb-1">🌱</div>
                                Soil Conditions
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Quick Suggestions */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 flex-wrap justify-center"
                >
                    <span className="text-white/30 text-xs">Quick fill:</span>
                    {[
                        { label: "Nashik → Mumbai", origin: "Nashik", destination: "Mumbai", crop: "Strawberry" },
                        { label: "Pune → Delhi", origin: "Pune", destination: "Delhi", crop: "Onion (Nashik Red)" },
                        { label: "Nagpur → Bangalore", origin: "Nagpur", destination: "Bangalore", crop: "Orange (Nagpur Mandarin)" }
                    ].map((suggestion) => (
                        <button
                            key={suggestion.label}
                            onClick={() => {
                                setManualData({
                                    origin: suggestion.origin,
                                    destination: suggestion.destination,
                                    crop: suggestion.crop
                                });
                                setInputType('manual');
                            }}
                            className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white/80 transition-all font-light"
                        >
                            {suggestion.label}
                        </button>
                    ))}
                </motion.div>
            </div>

            {/* Footer Text */}
            <div className="absolute bottom-8 left-0 w-full text-center text-white/20 text-xs font-light">
                Powered by Gemini AI • ML Risk Prediction • Real-time Weather
            </div>
        </div>
    );
}
