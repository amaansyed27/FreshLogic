import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface HistoryItem {
    id: string;
    origin: string;
    destination: string;
    crop: string;
    riskLevel: string;
    riskScore: number;
    timestamp: number;
}

interface HistoryContextType {
    history: HistoryItem[];
    addToHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => void;
    clearHistory: () => void;
    loadHistoryItem: (item: HistoryItem) => void;
    selectedItem: HistoryItem | null;
}

const HistoryContext = createContext<HistoryContextType | null>(null);

const STORAGE_KEY = 'freshlogic_history';
const MAX_HISTORY_ITEMS = 20;

export function HistoryProvider({ children }: { children: ReactNode }) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setHistory(parsed);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }, []);

    // Save to localStorage when history changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }, [history]);

    const addToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
        const newItem: HistoryItem = {
            ...item,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };

        setHistory(prev => {
            // Remove duplicate routes (same origin/destination/crop)
            const filtered = prev.filter(
                h => !(h.origin === item.origin && h.destination === item.destination && h.crop === item.crop)
            );
            // Add new item at the beginning, limit to MAX_HISTORY_ITEMS
            return [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    };

    const loadHistoryItem = (item: HistoryItem) => {
        setSelectedItem(item);
    };

    return (
        <HistoryContext.Provider value={{ history, addToHistory, clearHistory, loadHistoryItem, selectedItem }}>
            {children}
        </HistoryContext.Provider>
    );
}

export function useHistory() {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error('useHistory must be used within a HistoryProvider');
    }
    return context;
}

// Helper to format relative time
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return new Date(timestamp).toLocaleDateString();
}
