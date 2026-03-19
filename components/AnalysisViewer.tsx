import React, { useState, useMemo, useEffect } from 'react';
import { AnalysisIssue, IssueSeverity, IssueCategory } from '../types';
import { AlertCircle, AlertTriangle, Info, X, Copy, Check } from 'lucide-react';

interface AnalysisViewerProps {
  text: string;
  issues: AnalysisIssue[];
  isLoading: boolean;
  hasAnalyzed: boolean;
}

export const AnalysisViewer: React.FC<AnalysisViewerProps> = ({ text, issues, isLoading, hasAnalyzed }) => {
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Reset selection when issues change or text changes to avoid stale index
  useEffect(() => {
    setSelectedIssueIndex(null);
  }, [issues, text]);

  // Helper to get color based on severity
  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.CRITICAL: return 'bg-red-100 border-red-300 text-red-800 decoration-red-400';
      case IssueSeverity.WARNING: return 'bg-orange-100 border-orange-300 text-orange-800 decoration-orange-400';
      case IssueSeverity.INFO: return 'bg-blue-100 border-blue-300 text-blue-800 decoration-blue-400';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getCategoryLabel = (category: IssueCategory) => {
    switch (category) {
      case IssueCategory.GENDER: return 'ジェンダー';
      case IssueCategory.RACE: return '人種・民族';
      case IssueCategory.ABILITY: return '障がい・身体的特徴';
      case IssueCategory.AGGRESSION: return '攻撃的表現';
      case IssueCategory.EXCLUSION: return '排他性';
      default: return 'その他';
    }
  };

  // Create highlight segments
  const segments = useMemo(() => {
    if (!text) return [];
    if (issues.length === 0) return [{ text, issueIndex: -1 }];

    const resultSegments: { text: string; issueIndex: number }[] = [];
    let lastIndex = 0;

    // Very basic simplistic matching for demo purposes. 
    // In a real production app, we would use exact indices returned by the backend or a robust diffing algorithm.
    // Here we iterate through the text and match the snippets found in issues.
    
    // Sort issues by where they might appear (heuristic: naive approach for demo)
    // A better way is to rely on simple string splitting for the DEMO to avoid complex index math in the frontend without backend indices.
    
    // Strategy: We will process the text and try to replace occurrences with markers, then split.
    // However, overlapping issues are tricky. We will assume for this MVP that issues don't overlap heavily.
    
    // Let's iterate linearly.
    // We create a map of ranges.
    
    interface Range { start: number; end: number; issueIndex: number }
    const ranges: Range[] = [];

    issues.forEach((issue, idx) => {
      if (!issue.originalText) return;
      
      let startIndex = 0;
      let foundIndex = text.indexOf(issue.originalText, startIndex);
      while (foundIndex !== -1) {
        // Check overlap
        const isOverlapping = ranges.some(r => 
          (foundIndex >= r.start && foundIndex < r.end) || 
          (foundIndex + issue.originalText.length > r.start && foundIndex + issue.originalText.length <= r.end)
        );

        if (!isOverlapping) {
            ranges.push({
                start: foundIndex,
                end: foundIndex + issue.originalText.length,
                issueIndex: idx
            });
        }
        foundIndex = text.indexOf(issue.originalText, foundIndex + 1);
      }
    });

    ranges.sort((a, b) => a.start - b.start);

    ranges.forEach(range => {
      if (range.start > lastIndex) {
        resultSegments.push({ text: text.slice(lastIndex, range.start), issueIndex: -1 });
      }
      resultSegments.push({ text: text.slice(range.start, range.end), issueIndex: range.issueIndex });
      lastIndex = range.end;
    });

    if (lastIndex < text.length) {
      resultSegments.push({ text: text.slice(lastIndex), issueIndex: -1 });
    }

    return resultSegments;
  }, [text, issues]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p>AIが分析中...</p>
        </div>
      </div>
    );
  }

  if (!text || !hasAnalyzed) {
    return (
      <div className="h-full flex items-center justify-center p-12 text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
        <p className="text-center whitespace-pre-wrap leading-relaxed">
          {text 
            ? '「チェックする」ボタンを押して\n分析結果を表示します' 
            : 'テキストを入力して分析を開始してください'}
        </p>
      </div>
    );
  }

  // Safe accessor for the currently selected issue
  const currentIssue = selectedIssueIndex !== null ? issues[selectedIssueIndex] : undefined;

  const handleCopyOutput = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Text Area with Highlights */}
      <div className="relative flex-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm overflow-y-auto leading-relaxed text-lg min-h-[300px] group/viewer">
        {hasAnalyzed && text && (
          <button
            onClick={handleCopyOutput}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all opacity-0 group-hover/viewer:opacity-100 z-10"
            title="テキストをコピー"
          >
            {copySuccess ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        )}
        {segments.map((segment, idx) => {
          if (segment.issueIndex === -1) {
            return <span key={idx} className="whitespace-pre-wrap">{segment.text}</span>;
          }
          const issue = issues[segment.issueIndex];
          
          // Safety check: if issue doesn't exist (e.g. index mismatch), treat as normal text
          if (!issue) {
            return <span key={idx} className="whitespace-pre-wrap">{segment.text}</span>;
          }

          const isSelected = selectedIssueIndex === segment.issueIndex;
          
          return (
            <span
              key={idx}
              onClick={() => setSelectedIssueIndex(segment.issueIndex)}
              className={`
                cursor-pointer border-b-2 px-0.5 rounded transition-all duration-200 whitespace-pre-wrap
                ${getSeverityColor(issue.severity)}
                ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 opacity-100' : 'opacity-90 hover:opacity-100'}
              `}
            >
              {segment.text}
            </span>
          );
        })}
      </div>

      {/* Details Panel */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-0 overflow-hidden shadow-sm h-64 flex flex-col">
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            {currentIssue ? '検出された問題' : '分析レポート'}
          </h3>
          {currentIssue && (
             <button onClick={() => setSelectedIssueIndex(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
             </button>
          )}
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {currentIssue ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${
                   currentIssue.severity === IssueSeverity.CRITICAL ? 'bg-red-100 text-red-600' :
                   currentIssue.severity === IssueSeverity.WARNING ? 'bg-orange-100 text-orange-600' :
                   'bg-blue-100 text-blue-600'
                }`}>
                  {currentIssue.severity === IssueSeverity.CRITICAL ? <AlertCircle className="w-6 h-6" /> :
                   currentIssue.severity === IssueSeverity.WARNING ? <AlertTriangle className="w-6 h-6" /> :
                   <Info className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                            {getCategoryLabel(currentIssue.category)}
                        </span>
                    </div>
                  <h4 className="font-bold text-slate-900 text-lg">
                    「{currentIssue.originalText}」
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {currentIssue.reason}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-indigo-100 mt-4 ml-0 sm:ml-14">
                <p className="text-xs text-indigo-500 font-bold uppercase mb-1">提案</p>
                <div className="flex items-center gap-2 text-indigo-900 font-medium">
                   {currentIssue.suggestion}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center space-y-2">
              {issues.length > 0 ? (
                <>
                  <div className="bg-white p-3 rounded-full shadow-sm mb-2">
                    <AlertCircle className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="font-medium text-slate-800">{issues.length} 個の改善点が見つかりました</p>
                  <p className="text-sm">ハイライトされた箇所をクリックして詳細を確認してください。</p>
                </>
              ) : (
                <>
                  <p className="font-medium">問題は検出されませんでした</p>
                  <p className="text-sm">あなたの文章は配慮が行き届いているようです。素晴らしい！</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};