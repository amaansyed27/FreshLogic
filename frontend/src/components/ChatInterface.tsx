import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface ChatInterfaceProps {
    context: {
        origin: string;
        destination: string;
        crop: string;
    };
    onAnalysisUpdate?: (data: any) => void;
}

export default function ChatInterface({ context, onAnalysisUpdate }: ChatInterfaceProps) {
    const [messages, setMessages] = useState([
        { role: "agent", text: "Hello! I'm FreshLogic AI. Monitoring your active routes. Ask me about weather, spoilage risk, or crop storage tips!" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    origin: context.origin,
                    destination: context.destination,
                    crop_type: context.crop,
                    user_query: input
                })
            });
            const data = await res.json();

            setMessages(prev => [...prev, { role: "agent", text: data.agent_insight }]);
            if (onAnalysisUpdate) {
                onAnalysisUpdate(data);
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: "agent", text: "Connection Error: Could not reach the AI Agent." }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                <AnimatePresence>
                    {messages.map((msg, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                            {msg.role === 'agent' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-900/20">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={`max-w-[80%] p-4 rounded-2xl backdrop-blur-md shadow-sm border border-white/5 ${msg.role === "user"
                                ? "bg-white/10 text-white rounded-tr-sm"
                                : "bg-black/20 text-gray-200 rounded-tl-sm"
                                }`}>
                                {msg.role === 'agent' ? (
                                    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
                                        <ReactMarkdown
                                            components={{
                                                p: ({children}) => <p className="text-gray-200 mb-2">{children}</p>,
                                                strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                                                ul: ({children}) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                                                li: ({children}) => <li className="text-gray-200">{children}</li>,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                        </div>
                        <div className="bg-black/20 text-gray-400 px-4 py-2 rounded-2xl rounded-tl-sm text-sm border border-white/5 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        className="w-full pl-4 pr-12 py-3 bg-white/5 rounded-xl border border-white/10 focus:border-green-500/50 focus:bg-white/10 focus:outline-none transition-all text-white placeholder:text-white/20"
                        placeholder="Ask FreshLogic regarding route..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className="absolute right-2 p-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg text-white transition-all shadow-lg shadow-green-900/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
