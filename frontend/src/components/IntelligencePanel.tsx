
import { useState } from "react";
import ChatInterface from "./ChatInterface";
import { FileText, MessageSquare, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

interface IntelligencePanelProps {
    context: any;
    data: any;
    loading: boolean;
    onAnalysisUpdate: (data: any) => void;
}

export default function IntelligencePanel({ context, data, loading, onAnalysisUpdate }: IntelligencePanelProps) {
    const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');

    return (
        <div className="glass-panel rounded-3xl h-full flex flex-col overflow-hidden relative">
            {/* Header / Tabs */}
            <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/10">
                <div className="flex bg-black/20 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('report')}
                        className={clsx(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'report' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <FileText className="w-4 h-4" />
                        Analysis Report
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={clsx(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            activeTab === 'chat' ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/60"
                        )}
                    >
                        <MessageSquare className="w-4 h-4" />
                        AI Agent
                    </button>
                </div>

                <button className="text-white/30 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                </button>
            </div>

            {/* Content Content */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'report' ? (
                        <motion.div
                            key="report"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="h-full overflow-y-auto p-6 custom-scrollbar"
                        >
                            {loading && (
                                <div className="space-y-4 animate-pulse">
                                    <div className="h-4 bg-white/5 rounded w-3/4"></div>
                                    <div className="h-4 bg-white/5 rounded w-1/2"></div>
                                    <div className="h-32 bg-white/5 rounded w-full"></div>
                                </div>
                            )}

                            {!loading && data?.agent_insight ? (
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300">
                                    <div className="whitespace-pre-wrap font-light leading-7">
                                        {data.agent_insight}
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-white/10 flex flex-col gap-2">
                                        <h4 className="text-white/50 text-xs uppercase tracking-wider">Risk Factors</h4>
                                        <div className="flex gap-2">
                                            {data.risk_analysis?.spoilage_risk > 0.5 ? (
                                                <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs border border-red-500/20">High Spoilage Risk</span>
                                            ) : (
                                                <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs border border-green-500/20">Optimal Conditions</span>
                                            )}
                                            <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs border border-blue-500/20">
                                                {data.route?.distance_km} km
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-white/20">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No analysis generated yet.</p>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full"
                        >
                            <ChatInterface context={context} onAnalysisUpdate={onAnalysisUpdate} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
