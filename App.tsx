import React, { useState, useCallback } from 'react';
import { ProcessingItem, FingerprintConfig } from './types';
import { SCENARIOS, DEFAULT_CONFIG, AVAILABLE_MODELS } from './constants';
import { generateFingerprint } from './services/geminiService';
import FingerprintCard from './components/FingerprintCard';
import { analyzeSimilarity, getSimilarityColor, SimilarityAnalysis } from './utils/similarity';
import { BrainCircuit, Play, RefreshCw, Wand2, FlaskConical, Settings, RotateCcw, X, Plus, Minus, Sliders, Cpu, Calculator, Sigma, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<ProcessingItem[]>([]);
  const [definition, setDefinition] = useState(''); 
  const [label, setLabel] = useState('');
  const [activeTab, setActiveTab] = useState<'playground' | 'scenarios'>('scenarios');
  
  // Configuration State
  const [config, setConfig] = useState<FingerprintConfig>(DEFAULT_CONFIG);
  const [showSettings, setShowSettings] = useState(false);

  // Detail Modal State
  const [selectedCombo, setSelectedCombo] = useState<{
    itemA: ProcessingItem;
    itemB: ProcessingItem;
    analysis: SimilarityAnalysis;
  } | null>(null);

  const handleAddItem = useCallback(async (inputDefinition: string, inputLabel?: string) => {
    if (!inputDefinition.trim()) return;

    // Capture current config at the moment of generation
    const currentConfig = { ...config };

    const newItem: ProcessingItem = {
      id: crypto.randomUUID(),
      input: inputDefinition,
      label: inputLabel || 'Custom Definition',
      config: currentConfig,
      loading: true,
    };

    setItems(prev => [...prev, newItem]);

    try {
      const result = await generateFingerprint(inputDefinition, currentConfig);
      setItems(prev => prev.map(item => 
        item.id === newItem.id ? { ...item, result, loading: false } : item
      ));
    } catch (error) {
      setItems(prev => prev.map(item => 
        item.id === newItem.id ? { ...item, error: 'Failed to generate fingerprint', loading: false } : item
      ));
    }
  }, [config]);

  const handleRunScenario = (scenarioId: string) => {
    setItems([]); // Clear previous
    const scenario = SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setActiveTab('playground');
      scenario.items.forEach((item, index) => {
        // Stagger calls slightly to look nice
        setTimeout(() => handleAddItem(item.input, item.label), index * 200);
      });
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateTier = (index: number, updates: Partial<typeof config.tiers[0]>) => {
    const newTiers = [...config.tiers];
    newTiers[index] = { ...newTiers[index], ...updates };
    setConfig({ ...config, tiers: newTiers });
  };

  const updateTotalCount = (delta: number) => {
    setConfig(prev => ({
        ...prev,
        totalCount: Math.max(1, Math.min(20, prev.totalCount + delta))
    }));
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
        const analysis = analyzeSimilarity(itemA.result!, itemB.result!);
        combinations.push({ itemA, itemB, analysis });
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
            <div 
              key={idx} 
              onClick={() => setSelectedCombo(combo)}
              className={`p-4 rounded-lg border flex flex-col justify-between cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${getSimilarityColor(combo.analysis.score)}`}
            >
              <div className="flex justify-between items-start mb-3 gap-3 pointer-events-none">
                 {/* Item A Label */}
                 <div className="flex flex-col w-1/2 min-w-0">
                   <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sense A</span>
                      {combo.itemA.label && <span className="text-[10px] opacity-40 truncate">({combo.itemA.label})</span>}
                   </div>
                   <span className="text-xs font-medium leading-snug line-clamp-3 mt-1" title={combo.itemA.result?.sense_description}>
                     {combo.itemA.result?.sense_description || combo.itemA.input}
                   </span>
                 </div>
                 
                 {/* Item B Label */}
                 <div className="flex flex-col w-1/2 min-w-0 text-right">
                   <div className="flex items-center justify-end gap-1">
                      {combo.itemB.label && <span className="text-[10px] opacity-40 truncate">({combo.itemB.label})</span>}
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Sense B</span>
                   </div>
                   <span className="text-xs font-medium leading-snug line-clamp-3 mt-1" title={combo.itemB.result?.sense_description}>
                     {combo.itemB.result?.sense_description || combo.itemB.input}
                   </span>
                 </div>
              </div>
              
              <div className="flex items-end justify-between mt-2 pt-2 border-t border-black/5 pointer-events-none">
                <span className="text-xs uppercase font-bold opacity-60 flex items-center gap-1">
                  <Calculator size={12} />
                  Calculated Affinity
                </span>
                <span className="text-2xl font-bold tracking-tight">{(combo.analysis.score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-black/10 h-1.5 mt-2 rounded-full overflow-hidden pointer-events-none">
                <div className="h-full bg-current opacity-50" style={{ width: `${combo.analysis.score * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const isFormValid = definition.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Semantic Fingerprint</h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">Linguistic Sense Extractor</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <nav className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('scenarios')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'scenarios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tests
                </button>
                <button 
                  onClick={() => setActiveTab('playground')}
                  className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'playground' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Playground
                </button>
             </nav>
             
             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             <button 
               onClick={() => setShowSettings(!showSettings)}
               className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-all border ${showSettings ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
             >
               <Settings size={16} />
               <span className="hidden sm:inline">Config</span>
             </button>
          </div>
        </div>

        {/* Global Settings Panel */}
        {showSettings && (
          <div className="border-t border-slate-200 bg-slate-50/90 backdrop-blur-sm animate-in slide-in-from-top-2">
             <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4">
                    <div>
                        <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                            <Sliders size={14} />
                            Generation Configuration
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            Configure model choice and how the AI distributes semantic weight.
                        </p>
                    </div>
                  
                    <div className="flex items-center gap-4">
                        <button 
                        onClick={() => setConfig(DEFAULT_CONFIG)}
                        className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors"
                        >
                        <RotateCcw size={12} /> Reset Defaults
                        </button>
                        <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Model Selection */}
                <div className="mb-8">
                    <label className="text-sm font-bold uppercase text-slate-500 block mb-3 flex items-center gap-2">
                        <Cpu size={14} />
                        Active Model
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {AVAILABLE_MODELS.map(model => (
                            <button
                                key={model.id}
                                onClick={() => setConfig({ ...config, model: model.id })}
                                className={`px-4 py-3 text-left rounded-lg border transition-all ${
                                    config.model === model.id
                                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500 text-indigo-700 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <div className="font-semibold text-sm truncate" title={model.name}>{model.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={model.id}>{model.id}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Global Total Count Control */}
                <div className="mb-8 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
                        <label className="text-sm font-bold uppercase text-slate-500">Total Fingerprint Size (Words)</label>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => updateTotalCount(-1)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="w-12 text-center font-mono font-bold text-2xl text-indigo-600">{config.totalCount}</span>
                            <button 
                                onClick={() => updateTotalCount(1)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {config.tiers.map((tier, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-10">
                            <span className="text-6xl font-black">{idx + 1}</span>
                       </div>
                       
                       <div className="flex justify-between items-center mb-4 relative z-10">
                          <span className="font-semibold text-slate-800 text-sm">{tier.label}</span>
                          <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">Tier {idx + 1}</span>
                       </div>
                       
                       {/* Weight Control */}
                       <div className="mb-4 relative z-10">
                          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Relevance Weight</label>
                          <div className="flex items-center gap-3">
                             <input 
                               type="range"
                               min="0"
                               max="1"
                               step="0.05"
                               value={tier.weight}
                               onChange={(e) => updateTier(idx, { weight: parseFloat(e.target.value) })}
                               className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                             />
                             <span className="font-mono text-lg font-bold text-indigo-600 w-12 text-right">
                               {tier.weight.toFixed(2)}
                             </span>
                          </div>
                       </div>
                       
                       <div className="bg-slate-50 p-3 rounded text-xs text-slate-500 italic leading-relaxed border border-slate-100 relative z-10 min-h-[4em]">
                         "{tier.description}"
                       </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}
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
                     <div key={i} className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 truncate group-hover:bg-white group-hover:border-indigo-100 flex gap-2">
                        {item.label && <span className="font-bold text-slate-400 select-none">[{item.label}]</span>}
                        <span className="truncate">{item.input}</span>
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
                <div className="flex-[2] w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                    Sense Definition / Meaning
                    <span className="text-indigo-600 text-[10px] bg-indigo-50 px-1.5 py-0.5 rounded-full">Core Input</span>
                  </label>
                  <input 
                    type="text" 
                    value={definition}
                    onChange={(e) => setDefinition(e.target.value)}
                    placeholder="e.g. 冬天到夏天之间的季节，或者一种可以压缩的金属零件..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium text-slate-700"
                    onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleAddItem(definition, label)}
                    autoFocus
                  />
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Label (Optional)</label>
                  <input 
                    type="text" 
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="e.g. Bank (Financial)"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && isFormValid && handleAddItem(definition, label)}
                  />
                </div>
                <button
                  onClick={() => {
                    if (isFormValid) {
                      handleAddItem(definition, label);
                      setDefinition('');
                      setLabel('');
                    }
                  }}
                  disabled={!isFormValid}
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
                 <p className="text-sm">Enter a Meaning/Definition above or select a Test Scenario.</p>
               </div>
            )}
          </div>
        )}
      </main>

      {/* Detailed Analysis Modal */}
      {selectedCombo && (
         <div 
           className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
           onClick={() => setSelectedCombo(null)}
         >
           <div 
             className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col"
             onClick={e => e.stopPropagation()}
           >
             <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Calculator className="text-indigo-600" size={20} />
                 Similarity Calculation
               </h3>
               <button 
                 onClick={() => setSelectedCombo(null)}
                 className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <div className="flex flex-col sm:flex-row gap-8 mb-8">
                  <div className="flex-1">
                     <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Sense A (Denominator 1)</div>
                     <div className="font-medium text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 mb-2 text-sm leading-relaxed">
                        {selectedCombo.itemA.input}
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Weight:</span>
                        <span className="font-mono font-bold">{selectedCombo.analysis.totalWeightA.toFixed(2)}</span>
                     </div>
                  </div>
                  <div className="flex-1">
                     <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Sense B (Denominator 2)</div>
                     <div className="font-medium text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 mb-2 text-sm leading-relaxed">
                        {selectedCombo.itemB.input}
                     </div>
                     <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Total Weight:</span>
                        <span className="font-mono font-bold">{selectedCombo.analysis.totalWeightB.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               {/* Formula Header */}
               <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                       <div className="bg-white p-2 rounded shadow-sm border border-indigo-100">
                          <Sigma className="text-indigo-600" size={16} />
                       </div>
                       <div className="text-sm font-medium text-indigo-900">
                         Intersection Sum: <span className="font-bold font-mono text-lg ml-1">{selectedCombo.analysis.intersectionSum.toFixed(2)}</span>
                       </div>
                    </div>
                    
                    <div className="hidden sm:block text-indigo-300">/</div>

                    <div className="flex items-center gap-2">
                       <div className="text-sm font-medium text-indigo-900 text-right">
                         <div>Min Total Weight</div>
                         <div className="text-xs opacity-60 font-mono">Math.min({selectedCombo.analysis.totalWeightA.toFixed(1)}, {selectedCombo.analysis.totalWeightB.toFixed(1)})</div>
                       </div>
                       <div className="bg-white p-2 rounded shadow-sm border border-indigo-100 font-bold font-mono text-lg text-indigo-700">
                          {Math.min(selectedCombo.analysis.totalWeightA, selectedCombo.analysis.totalWeightB).toFixed(2)}
                       </div>
                    </div>

                    <div className="hidden sm:block text-indigo-300">=</div>

                    <div className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm shadow-indigo-200">
                      {(selectedCombo.analysis.score * 100).toFixed(1)}%
                    </div>
                 </div>
               </div>

               {/* Matches Table */}
               <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                 Matched Anchors & Contributions
                 <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                   Logic: Tier 1 OR Cross Tier → Avg * 1.2
                 </span>
               </h4>
               
               {selectedCombo.analysis.matches.length > 0 ? (
                 <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                       <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                          <tr>
                             <th className="px-4 py-3">Word</th>
                             <th className="px-4 py-3 text-right">Weight A</th>
                             <th className="px-4 py-3 text-right">Weight B</th>
                             <th className="px-4 py-3 text-right">Average</th>
                             <th className="px-4 py-3 text-right">Contribution</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {selectedCombo.analysis.matches.map((match, i) => (
                             <tr key={i} className={`hover:bg-slate-50/50 ${match.isBonus ? 'bg-indigo-50/10' : ''}`}>
                                <td className="px-4 py-2 font-medium text-slate-700">{match.word}</td>
                                <td className="px-4 py-2 text-right font-mono text-slate-500">{match.weightA.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-mono text-slate-500">{match.weightB.toFixed(2)}</td>
                                <td className="px-4 py-2 text-right font-mono text-slate-400">{((match.weightA + match.weightB)/2).toFixed(2)}</td>
                                <td className={`px-4 py-2 text-right font-mono font-bold ${match.isBonus ? 'text-indigo-600 bg-indigo-50/30' : 'text-slate-600'}`}>
                                   +{match.contribution.toFixed(2)}
                                   {match.isBonus && (
                                     <span className="text-[9px] ml-1 bg-indigo-600 text-white px-1 py-0.5 rounded opacity-80">
                                       {match.bonusType === 'tier1' ? 'TIER 1' : 'CROSS'}
                                     </span>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                       <tfoot className="bg-slate-50 font-bold text-slate-700">
                          <tr>
                             <td colSpan={4} className="px-4 py-3 text-right text-xs uppercase tracking-wider">Total Intersection Sum</td>
                             <td className="px-4 py-3 text-right text-indigo-700">{selectedCombo.analysis.intersectionSum.toFixed(2)}</td>
                          </tr>
                       </tfoot>
                    </table>
                 </div>
               ) : (
                 <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    No shared semantic anchors found.
                 </div>
               )}
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

export default App;