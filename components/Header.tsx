import React from 'react';
import { Sparkles, Info } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Kotoba<span className="text-indigo-600">Check</span>
          </h1>
          <span className="hidden sm:inline-block ml-3 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-500 rounded-full border border-slate-200">
            Beta
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <a 
            href="#" 
            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            title="AlexJSについて"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Concept based on AlexJS</span>
          </a>
        </div>
      </div>
    </header>
  );
};
