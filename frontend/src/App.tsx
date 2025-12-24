
import { useState } from "react";
import WorkspaceLayout from "./components/WorkspaceLayout";
import LandingPage from "./components/LandingPage";
import { AnimatePresence, motion } from "framer-motion";
import { HistoryProvider } from "./context/HistoryContext";

function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  // Track start params to trigger immediate analysis in Dashboard
  const [startParams, setStartParams] = useState<{ mode: string; query: string } | null>(null);

  const [inputs, setInputs] = useState({
    origin: 'Nashik',
    destination: 'Mumbai',
    crop: 'Strawberry'
  });

  const handleStart = (mode: string, query: string, manualInputs?: any) => {
    console.log(`Starting in ${mode} mode with query: ${query}`);
    if (manualInputs) {
      setInputs(prev => ({ ...prev, ...manualInputs }));
    }
    setStartParams({ mode, query });
    setView('dashboard');
  };

  const handleReset = () => {
    setStartParams(null);
    setView('landing');
  };

  const handleLoadFromHistory = (historyItem: any) => {
    setInputs({
      origin: historyItem.origin,
      destination: historyItem.destination,
      crop: historyItem.crop
    });
    setStartParams({ mode: 'route', query: `Re-analyze ${historyItem.origin} to ${historyItem.destination}` });
    setView('dashboard');
  };

  return (
    <HistoryProvider>
      <div className="h-screen w-screen bg-[#0f0f12] overflow-hidden text-white">
        <AnimatePresence mode="wait">
          {view === 'landing' ? (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage onStart={handleStart} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <WorkspaceLayout
                inputs={inputs}
                setInputs={setInputs}
                startParams={startParams}
                onReset={handleReset}
                onLoadFromHistory={handleLoadFromHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </HistoryProvider>
  );
}

export default App;
