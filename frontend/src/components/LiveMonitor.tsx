
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { Thermometer, Clock, AlertTriangle, TrendingUp, Navigation } from 'lucide-react';

interface LiveMonitorProps {
    data: any;
    loading: boolean;
}

export default function LiveMonitor({ data, loading }: LiveMonitorProps) {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p>Acquiring Telemetry...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Navigation className="w-16 h-16 mb-4 opacity-20" />
                <p>Waiting for route analysis...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">

            {/* KPI Grid */}
            <div className="grid grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Navigation className="w-3 h-3" /> DISTANCE
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                        {data?.route?.distance_km || 0} <span className="text-sm font-normal text-white/40">km</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Clock className="w-3 h-3" /> TRANSIT
                    </div>
                    <div className="text-2xl font-bold tracking-tight">
                        {data?.route?.duration_hours || 0} <span className="text-sm font-normal text-white/40">hrs</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <AlertTriangle className="w-3 h-3" /> RISK
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${data?.risk_analysis?.spoilage_risk > 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                        {(data?.risk_analysis?.spoilage_risk * 100).toFixed(0)}%
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <TrendingUp className="w-3 h-3" /> YIELD
                    </div>
                    <div className="text-2xl font-bold tracking-tight text-emerald-400">
                        {(100 - (data?.risk_analysis?.spoilage_risk || 0) * 100).toFixed(0)}%
                    </div>
                </motion.div>
            </div>

            {/* Live Chart */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                className="glass p-6 rounded-3xl flex-1 min-h-[300px] flex flex-col"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white/80 font-medium flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-400" />
                        Live Telemetry
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        Live Feed
                    </span>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.telemetry_points || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="condition"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                interval={1}
                            />
                            <YAxis
                                yAxisId="left"
                                stroke="#f97316"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                stroke="#3b82f6"
                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a2e', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                itemStyle={{ fontSize: '12px' }}
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="internal_temp"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{ fill: '#f97316', r: 4, strokeWidth: 0 }}
                                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                            />
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="humidity"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                dot={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
