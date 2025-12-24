
import { useState } from 'react';
import { Sparkles, Navigation } from 'lucide-react';
import clsx from 'clsx';
import { CROP_LIST } from '../constants/crops';

interface CommandBarProps {
    inputs: { origin: string; destination: string; crop: string };
    setInputs: (val: any) => void;
    onAnalyze: () => void;
}

export default function CommandBar({ inputs, setInputs, onAnalyze }: CommandBarProps) {
    const [mode, setMode] = useState<'nlp' | 'manual'>('manual');
    const [nlpQuery, setNlpQuery] = useState('');

    const handleNlpSubmit = () => {
        // Simple keyword extraction for demo (in prod, use LLM extraction)
        const lowerQ = nlpQuery.toLowerCase();
        let detectedCrop = inputs.crop;

        // Try to find a crop in the query
        for (const crop of CROP_LIST) {
            if (lowerQ.includes(crop.split('(')[0].toLowerCase().trim())) {
                detectedCrop = crop;
                break;
            }
        }

        // Simple heuristic for cities (looks for "from X to Y")
        // This is a basic parser for the "AI Assist" demo.
        // True NLP would happen on backend.
        if (lowerQ.includes("mumbai")) setInputs((prev: any) => ({ ...prev, destination: "Mumbai" }));
        if (lowerQ.includes("nashik")) setInputs((prev: any) => ({ ...prev, origin: "Nashik" }));
        if (lowerQ.includes("pune")) setInputs((prev: any) => ({ ...prev, origin: "Pune" }));
        if (lowerQ.includes("delhi")) setInputs((prev: any) => ({ ...prev, destination: "Delhi" }));

        setInputs((prev: any) => ({ ...prev, crop: detectedCrop }));
        onAnalyze();
    };

    return (
        <div className="glass-panel rounded-2xl p-2 flex flex-col md:flex-row gap-4 items-center justify-between relative shadow-2xl border border-white/5 bg-[#1a1a1e]/80 backdrop-blur-xl">

            {/* Mode Switcher */}
            <div className="flex bg-black/40 rounded-xl p-1 shrink-0">
                <button
                    onClick={() => setMode('manual')}
                    className={clsx(
                        "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                        mode === 'manual' ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm" : "text-white/40 hover:text-white/60"
                    )}
                >
                    Manual Input
                </button>
                <button
                    onClick={() => setMode('nlp')}
                    className={clsx(
                        "px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1",
                        mode === 'nlp' ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm" : "text-white/40 hover:text-white/60"
                    )}
                >
                    <Sparkles className="w-3 h-3" /> AI Assist
                </button>
            </div>

            {/* Input Area */}
            <div className="flex-1 w-full flex justify-center px-4">
                {mode === 'manual' ? (
                    <div className="flex flex-col md:flex-row gap-2 w-full max-w-4xl">

                        {/* Origin */}
                        <div className="flex-1 relative group md:w-1/3">
                            <div className="absolute left-3 top-2.5 z-10">
                                <Navigation className="w-4 h-4 text-green-500/70" />
                            </div>
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-white/5 transition-all placeholder:text-white/20"
                                placeholder="Origin City (e.g. Nashik)"
                                value={inputs.origin}
                                onChange={(e) => setInputs({ ...inputs, origin: e.target.value })}
                            />
                        </div>

                        {/* Arrow */}
                        <span className="hidden md:flex self-center text-white/20">➔</span>

                        {/* Destination */}
                        <div className="flex-1 relative group md:w-1/3">
                            <div className="absolute left-3 top-2.5 z-10 w-4 h-4 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                            </div>
                            <input
                                className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/40 focus:bg-white/5 transition-all placeholder:text-white/20"
                                placeholder="Destination City (e.g. Mumbai)"
                                value={inputs.destination}
                                onChange={(e) => setInputs({ ...inputs, destination: e.target.value })}
                            />
                        </div>

                        {/* Crop Selector */}
                        <div className="relative md:w-1/3">
                            <select
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500/50 focus:bg-white/5 transition-all appearance-none cursor-pointer scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
                                value={inputs.crop}
                                onChange={(e) => setInputs({ ...inputs, crop: e.target.value })}
                            >
                                <option value="" disabled>Select Crop</option>
                                {CROP_LIST.map(crop => (
                                    <option key={crop} value={crop} className="bg-[#1a1a1e] text-white py-1">
                                        {crop}
                                    </option>
                                ))}
                            </select>
                            {/* Custom Arrow */}
                            <div className="absolute right-3 top-3 pointer-events-none">
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white/40" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-3xl">
                        <input
                            className="w-full bg-black/30 border border-purple-500/30 rounded-xl pl-4 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:bg-purple-500/10 transition-all placeholder:text-purple-300/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)]"
                            placeholder="Try asking: 'Analyze strawberry shipment from Nashik to Delhi'"
                            value={nlpQuery}
                            onChange={(e) => setNlpQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleNlpSubmit()}
                        />
                        <button
                            onClick={handleNlpSubmit}
                            className="absolute right-2 top-2 text-purple-400 hover:text-purple-300 transition-colors p-1 hover:bg-white/10 rounded-lg"
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Action */}
            <button
                onClick={onAnalyze}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-green-900/40 transition-all hover:scale-[1.02] active:scale-95 shrink-0 tracking-wide border border-white/10"
            >
                Analyze Route
            </button>
        </div>
    );
}
