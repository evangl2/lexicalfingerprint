import React from 'react';
import { ProcessingItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { generateDiscoveryKey } from '../utils/similarity';

interface Props {
  item: ProcessingItem;
  onRemove: (id: string) => void;
}

const FingerprintCard: React.FC<Props> = ({ item, onRemove }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full transition-all hover:shadow-md">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
        <div className="w-full pr-4">
          {item.label && (
             <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
               {item.label}
             </div>
          )}
          <h3 className="font-medium text-slate-700 text-sm leading-relaxed italic line-clamp-3" title={item.input}>
             "{item.input}"
          </h3>
        </div>
        <button 
          onClick={() => onRemove(item.id)}
          className="text-slate-400 hover:text-red-500 transition-colors -mt-1 -mr-1 p-1"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-4 min-h-[300px] flex flex-col">
        {item.loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
            <span className="text-sm font-medium">Extracting Sense...</span>
          </div>
        ) : item.error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-red-500 p-4 text-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">{item.error}</p>
          </div>
        ) : item.result ? (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">Extracted Semantic Sense</span>
                {item.result && (
                  <span className="flex items-center gap-1 text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 border border-slate-200">
                    <Fingerprint size={10} />
                    ID: {generateDiscoveryKey(item.result.fingerprint)}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-indigo-50/50 p-2 rounded-md border border-indigo-100">
                {item.result.sense_description}
              </p>
            </div>

            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={item.result.fingerprint} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <XAxis type="number" domain={[0, 1.2]} hide />
                  <YAxis 
                    type="category" 
                    dataKey="word" 
                    width={80} 
                    tick={{ fontSize: 12, fill: '#475569' }}
                    interval={0}
                  />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="weight" radius={[0, 4, 4, 0]} barSize={20}>
                    {item.result.fingerprint.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.weight >= 1.0 ? '#4f46e5' : entry.weight >= 0.7 ? '#818cf8' : '#c7d2fe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
               {item.result.fingerprint.map((fp, i) => (
                 <div key={i} className="flex justify-between items-center bg-slate-50 px-2 py-1 rounded">
                    <span className="font-medium text-slate-700">{fp.word}</span>
                    <span className="font-mono text-slate-400">{fp.weight.toFixed(1)}</span>
                 </div>
               ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default FingerprintCard;