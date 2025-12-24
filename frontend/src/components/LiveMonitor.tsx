
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, ComposedChart } from 'recharts';
import { motion } from 'framer-motion';
import { Thermometer, Clock, Navigation, Droplets, Calendar, Leaf, MapPin, AlertTriangle } from 'lucide-react';

interface LiveMonitorProps {
    data: any;
    loading: boolean;
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        'Safe': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Optimal': 'bg-green-500/20 text-green-400 border-green-500/30',
        'Warning': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Critical': 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || colors['Warning']}`}>
            {status}
        </span>
    );
}

export default function LiveMonitor({ data, loading }: LiveMonitorProps) {
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30 space-y-4">
                <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p>Analyzing route conditions...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-white/30">
                <Navigation className="w-16 h-16 mb-4 opacity-20" />
                <p>Enter route details to begin analysis</p>
            </div>
        );
    }

    // Calculate temperature stats from telemetry
    const temps = data?.telemetry_points?.map((p: any) => p.internal_temp) || [];
    const minTemp = temps.length > 0 ? Math.min(...temps).toFixed(1) : 'N/A';
    const maxTemp = temps.length > 0 ? Math.max(...temps).toFixed(1) : 'N/A';
    const avgHumidity = data?.telemetry_points?.reduce((a: number, p: any) => a + p.humidity, 0) / (data?.telemetry_points?.length || 1);

    // Use route risk analysis if available
    const routeRisk = data?.route_risk_analysis || {};
    const tempVariance = routeRisk.temp_variance || (parseFloat(maxTemp) - parseFloat(minTemp));
    const dangerZones = routeRisk.danger_zone_count || 0;

    // Prepare chart data - prefer waypoint_predictions if available (has risk data)
    const chartData = data?.waypoint_predictions?.map((p: any) => ({
        waypoint: `${p.waypoint_num}`,
        temperature: p.temperature,
        humidity: p.humidity,
        instant_risk: (p.instant_risk * 100).toFixed(1),
        cumulative_risk: (p.cumulative_risk * 100).toFixed(1),
        status: p.instant_status,
        condition: p.condition,
        cumulative_hours: p.cumulative_hours,
        exposure_hours: p.exposure_hours
    })) || data?.telemetry_points?.map((p: any, i: number) => ({
        waypoint: `${i + 1}`,
        temperature: p.internal_temp,
        humidity: p.humidity,
        condition: p.condition || 'En Route'
    })) || [];

    return (
        <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">

            {/* Main Status Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="glass p-5 rounded-2xl border border-white/5"
            >
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                            <Leaf className="w-3 h-3" /> SHIPMENT STATUS
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge status={data?.risk_analysis?.status || 'Unknown'} />
                            <span className="text-white/60 text-sm">
                                {data?.risk_analysis?.days_remaining?.toFixed(1) || 'N/A'} days shelf life remaining
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white">
                            {(data?.risk_analysis?.spoilage_risk * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-white/40">Spoilage Risk</div>
                    </div>
                </div>

                {/* Route Info Bar */}
                <div className="flex items-center gap-2 text-sm text-white/70 bg-white/5 rounded-xl p-3">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span className="font-medium">{data?.route?.distance_km} km</span>
                    <span className="text-white/30">•</span>
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>{data?.route?.duration_hours?.toFixed(1)} hrs transit</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/40">{data?.telemetry_points?.length || 0} checkpoints</span>
                </div>
            </motion.div>

            {/* KPI Grid - More Farmer Focused */}
            <div className="grid grid-cols-3 gap-3">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Thermometer className="w-3 h-3 text-orange-400" /> TEMP RANGE
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                        {minTemp}° - {maxTemp}°
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">Along route</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Droplets className="w-3 h-3 text-blue-400" /> AVG HUMIDITY
                    </div>
                    <div className="text-xl font-bold tracking-tight">
                        {avgHumidity.toFixed(0)}%
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">Route average</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="glass p-4 rounded-2xl flex flex-col text-white"
                >
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
                        <Calendar className="w-3 h-3 text-emerald-400" /> SHELF LIFE
                    </div>
                    <div className="text-xl font-bold tracking-tight text-emerald-400">
                        {data?.risk_analysis?.days_remaining?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">Days remaining</div>
                </motion.div>
            </div>

            {/* Danger Zone Alert - if applicable */}
            {dangerZones > 0 && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="glass p-4 rounded-2xl border border-red-500/30 bg-red-500/5"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <div className="text-sm font-medium text-red-300">
                                {dangerZones} Danger Zone{dangerZones > 1 ? 's' : ''} Detected
                            </div>
                            <div className="text-xs text-white/50">
                                Temperature variance: {tempVariance.toFixed(1)}°C along route • 
                                {routeRisk.danger_hours?.toFixed(1) || '?'} hrs exposure in risky conditions
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Live Chart - Temperature & Risk Progression */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                className="glass p-5 rounded-2xl flex-1 min-h-[280px] flex flex-col"
            >
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-white/90 font-medium flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-orange-400" />
                            Route Risk Progression
                        </h3>
                        <p className="text-xs text-white/40 mt-1">Per-checkpoint analysis with cumulative risk assessment</p>
                    </div>
                    <div className="flex gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-orange-400 rounded"></div>
                            <span className="text-white/50">Temperature</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-red-400 rounded"></div>
                            <span className="text-white/50">Risk %</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-0.5 bg-blue-400 rounded"></div>
                            <span className="text-white/50">Humidity</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData}>
                            <defs>
                                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="waypoint"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: 'Checkpoint', position: 'insideBottom', offset: -5, fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            />
                            <YAxis
                                yAxisId="left"
                                domain={['dataMin - 5', 'dataMax + 5']}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: '°C', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            />
                            <YAxis
                                yAxisId="right"
                                orientation="right"
                                domain={[0, 100]}
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                label={{ value: '%', angle: 90, position: 'insideRight', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{ 
                                    backgroundColor: 'rgba(15, 15, 18, 0.95)', 
                                    borderColor: 'rgba(255,255,255,0.1)', 
                                    borderRadius: '12px',
                                    color: '#fff' 
                                }}
                                labelFormatter={(label) => `Checkpoint ${label}`}
                                formatter={(value: any, name?: string) => {
                                    if (name === 'temperature') return [`${value}°C`, 'Temperature'];
                                    if (name === 'humidity') return [`${value}%`, 'Humidity'];
                                    if (name === 'instant_risk') return [`${value}%`, 'Instant Risk'];
                                    if (name === 'cumulative_risk') return [`${value}%`, 'Cumulative Risk'];
                                    return [value, name || ''];
                                }}
                            />
                            {/* Temperature Area & Line */}
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                fill="url(#tempGradient)"
                                stroke="transparent"
                            />
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                stroke="#f97316"
                                strokeWidth={3}
                                dot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#1a1a2e' }}
                                activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                            />
                            {/* Risk Progression - if available */}
                            {chartData[0]?.instant_risk && (
                                <>
                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="cumulative_risk"
                                        fill="url(#riskGradient)"
                                        stroke="transparent"
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="instant_risk"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        dot={{ fill: '#ef4444', r: 4, strokeWidth: 1, stroke: '#1a1a2e' }}
                                    />
                                </>
                            )}
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="humidity"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#3b82f6', r: 3 }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Checkpoint Details Table - shows time at each location */}
            {chartData.length > 0 && chartData[0]?.cumulative_hours !== undefined && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="glass p-4 rounded-2xl"
                >
                    <h4 className="text-white/80 text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        Time Exposure Analysis
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-xs text-white/60 mb-2 px-2">
                        <span>Checkpoint</span>
                        <span>Temperature</span>
                        <span>Time in Transit</span>
                        <span>Risk at Point</span>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {chartData.slice(0, 8).map((point: any, i: number) => (
                            <div 
                                key={i} 
                                className={`grid grid-cols-4 gap-2 text-xs p-2 rounded-lg ${
                                    parseFloat(point.instant_risk) > 50 ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5'
                                }`}
                            >
                                <span className="text-white/80">#{point.waypoint}</span>
                                <span className="text-orange-400">{point.temperature}°C</span>
                                <span className="text-blue-400">{point.cumulative_hours?.toFixed(1) || '?'}h</span>
                                <span className={parseFloat(point.instant_risk) > 50 ? 'text-red-400 font-medium' : 'text-emerald-400'}>
                                    {point.instant_risk || '?'}%
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
