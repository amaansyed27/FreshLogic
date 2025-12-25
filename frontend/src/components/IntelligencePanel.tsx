
import { useState } from "react";
import ChatInterface from "./ChatInterface";
import { FileText, MessageSquare, Download, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";
import { exportReportAsPDF } from "../utils/pdfExport";
import type { AppSettings } from "./SettingsModal";

interface IntelligencePanelProps {
    context: any;
    data: any;
    loading: boolean;
    onAnalysisUpdate: (data: any) => void;
    settings?: AppSettings;
}

export default function IntelligencePanel({ context, data, loading, onAnalysisUpdate, settings }: IntelligencePanelProps) {
    const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report');
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    const handlePDFExport = async () => {
        if (!data?.agent_insight) return;
        setDownloadingPDF(true);
        try {
            await exportReportAsPDF(data, context);
        } catch (error) {
            console.error('PDF export failed:', error);
        } finally {
            setDownloadingPDF(false);
        }
    };

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

                <button 
                    onClick={handlePDFExport}
                    disabled={downloadingPDF || !data?.agent_insight}
                    className="text-white/30 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Download PDF Report"
                >
                    {downloadingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Download className="w-4 h-4" />
                    )}
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
                                <div className="space-y-6">
                                    {/* Summary Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-medium text-white mb-1">AI Analysis Report</h3>
                                            <p className="text-xs text-white/40">Powered by Gemini 2.5 + FreshLogic ML Model</p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${data.risk_analysis?.spoilage_risk > 0.5 ? 'text-red-400' : data.risk_analysis?.spoilage_risk > 0.2 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                {data.risk_analysis?.status || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-white/40">ML Prediction</div>
                                        </div>
                                    </div>

                                    {/* Key Metrics Bar */}
                                    <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                                        <div className="text-center">
                                            <div className="text-xl font-semibold text-white">{(data.risk_analysis?.spoilage_risk * 100).toFixed(0)}%</div>
                                            <div className="text-[10px] text-white/40">Spoilage Risk</div>
                                        </div>
                                        <div className="text-center border-x border-white/10">
                                            <div className="text-xl font-semibold text-emerald-400">{data.risk_analysis?.days_remaining?.toFixed(1) || 'N/A'}</div>
                                            <div className="text-[10px] text-white/40">Days Remaining</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-semibold text-blue-400">{data.route?.duration_hours?.toFixed(1)}h</div>
                                            <div className="text-[10px] text-white/40">Transit Time</div>
                                        </div>
                                    </div>

                                    {/* Agent Insight - Rendered as Markdown */}
                                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-strong:text-white prose-p:text-gray-300 prose-li:text-gray-300">
                                        <ReactMarkdown
                                            components={{
                                                p: ({children}) => <p className="text-gray-300 leading-7 text-[15px] mb-3">{children}</p>,
                                                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                                                ul: ({children}) => <ul className="list-disc list-inside space-y-1 text-gray-300">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal list-inside space-y-1 text-gray-300">{children}</ol>,
                                                li: ({children}) => <li className="text-gray-300">{children}</li>,
                                                h1: ({children}) => <h1 className="text-xl font-bold text-white mt-4 mb-2">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-base font-semibold text-white mt-3 mb-1">{children}</h3>,
                                            }}
                                        >
                                            {data.agent_insight}
                                        </ReactMarkdown>
                                    </div>

                                    {/* Data Sources Footer */}
                                    <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                                        <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[10px] border border-green-500/20 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                            Live Weather Data
                                        </span>
                                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] border border-blue-500/20 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                            ML Spoilage Model
                                        </span>
                                        <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full text-[10px] border border-purple-500/20 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                                            92 Crop Knowledge Base
                                        </span>
                                    </div>
                                </div>
                            ) : !loading && (
                                <div className="h-full flex flex-col items-center justify-center text-white/20">
                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                    <p>No analysis generated yet.</p>
                                    <p className="text-xs mt-2">Select origin, destination, and crop to begin</p>
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
                            <ChatInterface 
                                context={context} 
                                sessionId={data?.session_id}
                                onAnalysisUpdate={onAnalysisUpdate}
                                settings={settings}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
