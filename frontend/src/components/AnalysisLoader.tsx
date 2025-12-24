
import { motion } from "framer-motion";
import { BrainCircuit } from "lucide-react";
import { useState, useEffect } from "react";

export default function AnalysisLoader() {
    const [step, setStep] = useState(0);
    const steps = [
        "Connecting to Neural Network...",
        "Analyzing Route Telemetry...",
        "Predicting Spoilage Risks...",
        "Generating Optimization Report..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s < steps.length - 1 ? s + 1 : s));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-[#0f0f12] text-white relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-green-500/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[20%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <div className="z-10 flex flex-col items-center gap-8">
                {/* Visual Loader */}
                <div className="relative">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="w-24 h-24 rounded-full border-t-2 border-l-2 border-green-500 border-r-transparent border-b-transparent"
                    />
                    <motion.div
                        animate={{ rotate: -360 }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-b-2 border-r-2 border-purple-500 border-t-transparent border-l-transparent"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BrainCircuit className="w-8 h-8 text-white/80" />
                    </div>
                </div>

                {/* Steps Text */}
                <div className="flex flex-col items-center gap-2 h-16">
                    <motion.p
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-xl font-light tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60"
                    >
                        {steps[step]}
                    </motion.p>
                    <div className="flex gap-1 mt-2">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-colors duration-300 ${i <= step ? 'bg-green-500' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
