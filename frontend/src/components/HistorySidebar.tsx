import { ChevronRight, Clock, MapPin, Trash2, PlusCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useHistory, formatRelativeTime } from '../context/HistoryContext';
import clsx from 'clsx';

interface HistorySidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    onNewAnalysis?: () => void;
    onLoadHistory?: (item: any) => void;
}

export default function HistorySidebar({ isOpen, onToggle, onNewAnalysis, onLoadHistory }: HistorySidebarProps) {
    const { history, clearHistory } = useHistory();

    const handleItemClick = (item: any) => {
        if (onLoadHistory) {
            onLoadHistory({
                origin: item.origin,
                destination: item.destination,
                crop: item.crop
            });
        }
    };

    const getRiskIcon = (riskLevel: string) => {
        switch (riskLevel?.toLowerCase()) {
            case 'critical':
                return <AlertTriangle className="w-3 h-3 text-red-400" />;
            case 'warning':
                return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
            default:
                return <CheckCircle className="w-3 h-3 text-green-400" />;
        }
    };

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel?.toLowerCase()) {
            case 'critical':
                return 'border-red-500/20 hover:border-red-500/40';
            case 'warning':
                return 'border-yellow-500/20 hover:border-yellow-500/40';
            default:
                return 'border-green-500/20 hover:border-green-500/40';
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="absolute top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/20 transition-all"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        );
    }

    return (
        <aside className="h-full w-64 flex flex-col relative z-50">
            {/* Glass Panel Background */}
            <div className="absolute inset-0 bg-[#0f0f12]/80 backdrop-blur-xl border-r border-white/5" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
                        History ({history.length})
                    </h2>
                    <button onClick={onToggle} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                        <ChevronRight className="w-4 h-4 text-white/50 rotate-180" />
                    </button>
                </div>

                {/* New Analysis Button */}
                <button
                    onClick={onNewAnalysis}
                    className="flex items-center justify-center gap-2 w-full py-2.5 mb-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-green-900/20 transition-all active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    New Analysis
                </button>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-white/30 text-sm">
                            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>No history yet</p>
                            <p className="text-xs mt-1">Your analyses will appear here</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleItemClick(item)}
                                className={clsx(
                                    "group p-3 rounded-xl bg-white/5 border transition-all cursor-pointer hover:bg-white/10",
                                    getRiskColor(item.riskLevel)
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    {getRiskIcon(item.riskLevel)}
                                    <span className="text-sm text-white/90 font-medium truncate">
                                        {item.origin} → {item.destination}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pl-5">
                                    <span className="text-xs text-white/40 truncate max-w-[100px]">
                                        {item.crop.split('(')[0].trim()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={clsx(
                                            "text-[10px] px-1.5 py-0.5 rounded",
                                            item.riskLevel === 'Critical' ? 'bg-red-500/20 text-red-300' :
                                            item.riskLevel === 'Warning' ? 'bg-yellow-500/20 text-yellow-300' :
                                            'bg-green-500/20 text-green-300'
                                        )}>
                                            {Math.round(item.riskScore * 100)}%
                                        </span>
                                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeTime(item.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {history.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <button
                            onClick={clearHistory}
                            className="w-full py-2 text-xs text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-3 h-3" />
                            Clear History
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
