
import { useState, useEffect } from 'react';
import LiveMonitor from './LiveMonitor';
import IntelligencePanel from './IntelligencePanel';
import HistorySidebar from './HistorySidebar';
import CommandBar from './CommandBar';
import AnalysisLoader from './AnalysisLoader';
import SettingsModal, { type AppSettings } from './SettingsModal';
import { AnimatePresence, motion } from 'framer-motion';
import { useHistory } from '../context/HistoryContext';
import { Settings, Globe } from 'lucide-react';

interface WorkspaceLayoutProps {
    inputs: any;
    setInputs: any;
    startParams?: { mode: string; query: string } | null;
    onReset?: () => void;
    onLoadFromHistory?: (item: any) => void;
}

export default function WorkspaceLayout({ inputs, setInputs, startParams, onReset, onLoadFromHistory }: WorkspaceLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { addToHistory } = useHistory();

    // App Settings with localStorage persistence
    const [settings, setSettings] = useState<AppSettings>(() => {
        const saved = localStorage.getItem('freshlogic_settings');
        return saved ? JSON.parse(saved) : {
            language: 'en',
            languageName: 'English',
            darkMode: true,
            soundEnabled: false,
            autoTranslate: true
        };
    });

    // Lifted state for analysis data
    const [loading, setLoading] = useState(false);
    const [initialAnalysisComplete, setInitialAnalysisComplete] = useState(false);
    const [data, setData] = useState<any>(null);

    // Handle initial start params
    useEffect(() => {
        if (startParams && !initialAnalysisComplete) {
            handleAnalyze(startParams);
        }
    }, [startParams]);

    const handleAnalyze = async (params: any = inputs) => {
        setLoading(true);
        // If we are starting fresh (no data yet), we might want to keep the loader visible longer for effect
        // or until data arrives.

        try {
            // Mock delay for effect if it returns too fast (optional)
            if (!initialAnalysisComplete) await new Promise(r => setTimeout(r, 2000));

            const res = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: params.origin || inputs.origin,
                    destination: params.destination || inputs.destination,
                    crop_type: params.crop || inputs.crop,
                    language: settings.language  // Pass language for translation
                })
            });
            const result = await res.json();
            setData(result);
            setInitialAnalysisComplete(true);
            
            // Add to history on successful analysis
            const riskLevel = result.spoilage_risk?.status || result.risk_level || 'unknown';
            const riskScore = result.spoilage_risk?.probability !== undefined 
                ? result.spoilage_risk.probability 
                : (riskLevel === 'Critical' ? 0.8 : riskLevel === 'Warning' ? 0.5 : 0.2);
            
            addToHistory({
                origin: params.origin || inputs.origin,
                destination: params.destination || inputs.destination,
                crop: params.crop || inputs.crop,
                riskLevel,
                riskScore
            });
        } catch (err) {
            console.error(err);
            // Optional: add toast error here
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen w-full bg-[#0f0f12] overflow-hidden relative">

            {/* 1. History Sidebar (Collapsible) */}
            <HistorySidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onNewAnalysis={onReset}
                onLoadHistory={onLoadFromHistory}
            />

            <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">

                {/* SHOW LOADER IF INITIAL LOADING */}
                <AnimatePresence mode="wait">
                    {!initialAnalysisComplete && loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50"
                        >
                            <AnalysisLoader />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col h-full"
                        >
                            {/* Settings Button - Top Right */}
                            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                                {settings.language !== 'en' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400">
                                        <Globe className="w-3 h-3" />
                                        {settings.languageName}
                                    </div>
                                )}
                                <button
                                    onClick={() => setSettingsOpen(true)}
                                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all hover:scale-105"
                                    title="Settings"
                                >
                                    <Settings className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                                </button>
                            </div>

                            {/* 2. Top Command Bar */}
                            <div className="p-4 pb-0 z-20">
                                <CommandBar
                                    inputs={inputs}
                                    setInputs={setInputs}
                                    onAnalyze={() => handleAnalyze()}
                                />
                            </div>

                            {/* 3. Main Workspace Split (Left Pane / Right Pane) */}
                            <div className="flex-1 p-4 gap-4 flex overflow-hidden">

                                {/* Left Pane: Live Monitor (Telemetry, Maps) */}
                                <div className="flex-1 min-w-[400px] flex flex-col">
                                    <LiveMonitor data={data} loading={loading && initialAnalysisComplete} />
                                </div>

                                {/* Right Pane: Intelligence (Report / Chat) */}
                                <div className="flex-1 min-w-[400px] flex flex-col">
                                    <IntelligencePanel
                                        context={inputs}
                                        data={data}
                                        loading={loading && initialAnalysisComplete}
                                        onAnalysisUpdate={(newData) => setData(newData)}
                                        settings={settings}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={settings}
                onSettingsChange={setSettings}
            />

            {/* Background Ambience (Optional to reinforce glass effect) */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
                <div className="absolute top-[10%] left-[30%] w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[120px]" />
            </div>
        </div>
    );
}
