import React, { useState, useCallback } from 'react';
import { ProcessingItem } from './types';
import { SCENARIOS } from './constants';
import { generateFingerprint } from './services/geminiService';
import FingerprintCard from './components/FingerprintCard';
import { calculateSimilarity, getSimilarityColor } from './utils/similarity';
import { BrainCircuit, Play, RefreshCw, Wand2, FlaskConical } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [activeTab, setActiveTab] = useState<'playground' | 'scenarios'>('scenarios');

  const handleAddItem = useCallback(async (input: string, context?: string) => {
    const newItem: ProcessingItem = {
      id: crypto.randomUUID(),
      input,
      context,
      loading: true,
    };

    setItems(prev => [...prev, newItem]);

    try {
      const result = await generateFingerprint(input, context);
      setItems(prev => prev.map(item => 
        item.id === newItem.id ? { ...item, result, loading: false } : item
      ));
    } catch (error) {
      setItems(prev => prev.map(item => 
        item.id === newItem.id ? { ...item, error: 'Failed to generate fingerprint', loading: false } : item
      ));
    }
  }, []);

  const handleRunScenario = (scenarioId: string) => {
    setItems([]); // Clear previous
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveTab('playground');
      scenario.items.forEach((item, index) => {
        // Stagger calls slightly to look nice, though not strictly necessary
        setTimeout(() => handleAddItem(item.input, item.context), index * 200);
      });
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const renderComparisonMetrics = () => {
    const completedItems = items.filter(i => i.result && !i.loading);
    if (completedItems.length < 2) return null;

    // Calculate similarity matrix or just pairwise if small number
    const combinations = [];
    for (let i = 0; i < completedItems.length; i++) {
      for (let j = i + 1; j < completedItems.length; j++) {
        const itemA = completedItems[i];
        const itemB = completedItems[j];
        const score = calculateSimilarity(itemA.result!, itemB.result!);
        combinations.push({ itemA, itemB, score });
      }
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-indigo-600" />
          Sense Comparison Matrix
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combinations.map((combo, idx) => (
            <div key={idx} className={`p-4 rounded-lg border flex flex-col justify-between ${getSimilarityColor(combo.score)}`}>
              <div className="flex justify-between items-start mb-3 gap-3">
                 {/* Item A Label */}
                 <div className="flex flex-col w-1/2 min-w-0">
                   <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sense A</span>
                      {combo.itemA.input && <span className="text-[10px] opacity-40 truncate">({combo.itemA.input})</span>}
                   </div>
                   <span className="text-xs font-medium leading-snug line-clamp-3 mt-1" title={combo.itemA.result?.sense_description}>
                     {combo.itemA.result?.sense_description || combo.itemA.input}
                   </span>
                 </div>
                 
                 {/* Item B Label */}
                 <div className="flex flex-col w-1/2 min-w-0 text-right">
                   <div className="flex items-center justify-end gap-1">
                      {combo.itemB.input && <span className="text-[10px] opacity-40 truncate">({combo.itemB.input})</span>}
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sense B</span>
                   </div>
                   <span className="text-xs font-medium leading-snug line-clamp-3 mt-1" title={combo.itemB.result?.sense_description}>
                     {combo.itemB.result?.sense_description || combo.itemB.input}
                   </span>
                 </div>
              </div>
              
              <div className="flex items-end justify-between mt-2 pt-2 border-t border-black/5">
                <span className="text-xs uppercase font-bold opacity-60">Sense Affinity</span>
                <span className="text-2xl font-bold tracking-tight">{(combo.score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-black/10 h-1.5 mt-2 rounded-full overflow-hidden">
                <div className="h-full bg-current opacity-50" style={{ width: `${combo.score * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Semantic Fingerprint</h1>
              <p className="text-xs text-slate-500 font-medium">Linguistic Sense Extractor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <nav className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('scenarios')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'scenarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Test Suite
                </button>
                <button 
                  onClick={() => setActiveTab('playground')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'playground' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Playground
                </button>
             </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
        
        {/* Scenario Selection View */}
        {activeTab === 'scenarios' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {SCENARIOS.map(scenario => (
               <button 
                 key={scenario.id}
                 onClick={() => handleRunScenario(scenario.id)}
                 className="group text-left bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 p-6 rounded-xl transition-all shadow-sm hover:shadow-md flex flex-col h-full"
               >
                 <div className="flex items-center justify-between mb-3">
                   <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-700">{scenario.title}</h3>
                   <Play className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" />
                 </div>
                 <p className="text-slate-500 text-sm mb-6 flex-1">{scenario.description}</p>
                 <div className="space-y-2">
                   {scenario.items.map((item, i) => (
                     <div key={i} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 truncate group-hover:bg-white group-hover:border-indigo-100">
                       {item.input}
                     </div>
                   ))}
                 </div>
               </button>
             ))}
           </div>
        )}

        {/* Playground / Results View */}
        {activeTab === 'playground' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Input Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Lexical Input (Word/Phrase)</label>
                  <input 
                    type="text" 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="e.g. Bank, Spring, Sword"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && customInput && handleAddItem(customInput, customContext)}
                  />
                </div>
                <div className="flex-[2] w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Semantic Context (Optional)</label>
                  <input 
                    type="text" 
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="e.g. Financial institution..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && customInput && handleAddItem(customInput, customContext)}
                  />
                </div>
                <button
                  onClick={() => {
                    if (customInput) {
                      handleAddItem(customInput, customContext);
                      setCustomInput('');
                      setCustomContext('');
                    }
                  }}
                  disabled={!customInput}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200"
                >
                  <Wand2 size={18} />
                  Extract Sense
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <>
                {/* Comparison Analysis */}
                {renderComparisonMetrics()}

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(item => (
                    <FingerprintCard key={item.id} item={item} onRemove={removeItem} />
                  ))}
                  
                  {/* Empty State placeholder if user deleted all but kept tab open */}
                  {items.length === 0 && (
                     <div className="col-span-full text-center py-20 text-slate-400">
                       Start adding items to generate fingerprints
                     </div>
                  )}
                </div>
                
                {items.length > 0 && (
                   <div className="flex justify-center pt-8">
                     <button 
                       onClick={() => setItems([])}
                       className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors text-sm"
                     >
                       <RefreshCw size={14} /> Clear Workspace
                     </button>
                   </div>
                )}
              </>
            )}
            
            {items.length === 0 && (
               <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                 <p className="mb-2">Workspace is empty.</p>
                 <p className="text-sm">Use the form above or select a Test Scenario.</p>
               </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default App;