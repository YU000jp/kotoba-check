import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { AnalysisViewer } from './components/AnalysisViewer';
import { analyzeTextWithGemini } from './services/geminiService';
import { AnalysisIssue } from './types';
import { Play, RotateCcw, PenLine, ClipboardPaste, Copy, Check, Link, FileText, AlertCircle } from 'lucide-react';

const SAMPLE_TEXT = `当社の営業マンは非常に優秀です。
また、受付の女の子も愛想が良くて評判です。
外人の採用も積極的に行っています。
会議ではめくら判を押すだけでなく、活発な議論を求めます。`;
const analysisDisabledMessage = "この静的公開版では AI 分析を利用できません。ローカル実行または Node.js 対応環境にデプロイしてご利用ください。";
const urlFetchDisabledMessage = "この静的公開版では URL からの記事取得を利用できません。";
const isAnalysisAvailable = import.meta.env.VITE_ENABLE_ANALYSIS !== 'false';
const isUrlFetchAvailable = import.meta.env.VITE_ENABLE_URL_FETCH !== 'false';

function App() {
  const [inputText, setInputText] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [mode, setMode] = useState<'text' | 'url'>('text');
  const [issues, setIssues] = useState<AnalysisIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (textToAnalyze?: string) => {
    const text = textToAnalyze || inputText;
    if (!text.trim() || isAnalyzing) return;
    if (!isAnalysisAvailable) {
      setErrorMessage(analysisDisabledMessage);
      return;
    }

    setIsAnalyzing(true);
    setHasAnalyzed(false);
    setErrorMessage(null);
    
    try {
      const result = await analyzeTextWithGemini(text);
      setIssues(result.issues);
      setHasAnalyzed(true);
    } catch (e) {
      console.error("Analysis failed", e);
      setErrorMessage("分析に失敗しました。しばらくしてからもう一度お試しください。");
    } finally {
      setIsAnalyzing(false);
    }
  }, [inputText, isAnalyzing]);

  const handleFetchAndAnalyze = async () => {
    if (!urlInput.trim() || isFetchingUrl) return;
    if (!isUrlFetchAvailable) {
      setErrorMessage(urlFetchDisabledMessage);
      return;
    }

    setIsFetchingUrl(true);
    setErrorMessage(null);
    setIssues([]);
    setHasAnalyzed(false);

    try {
      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'URLの取得に失敗しました。');
      }

      setInputText(data.text);
      // Automatically start analysis after successful fetch
      await handleAnalyze(data.text);
    } catch (e: any) {
      console.error("Fetch failed", e);
      setErrorMessage(e.message || "URLの取得に失敗しました。");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleLoadSample = () => {
    setInputText(SAMPLE_TEXT);
    setHasAnalyzed(false);
    setIssues([]);
  };

  const handleReset = () => {
    setInputText('');
    setHasAnalyzed(false);
    setIssues([]);
  };

  const handlePaste = async () => {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      setErrorMessage("お使いのブラウザではクリップボードからの貼り付けがサポートされていないか、制限されています。");
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setHasAnalyzed(false);
      setIssues([]);
      setErrorMessage(null);
    } catch (err) {
      console.error('Failed to paste: ', err);
      setErrorMessage("クリップボードの読み取りに失敗しました。ブラウザの権限設定を確認してください。");
    }
  };

  const handleCopyInput = async () => {
    if (!inputText) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setErrorMessage("お使いのブラウザではクリップボードへのコピーがサポートされていません。");
      return;
    }
    try {
      await navigator.clipboard.writeText(inputText);
      setCopySuccess(true);
      setErrorMessage(null);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      setErrorMessage("クリップボードへのコピーに失敗しました。");
    }
  };
  const isAnalyzeButtonDisabled = !isAnalysisAvailable || !inputText.trim() || isAnalyzing;
  const analyzeButtonLabel = !isAnalysisAvailable ? '公開版では利用不可' : isAnalyzing ? '分析中...' : 'チェックする';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            誰もが読みやすい、<br className="sm:hidden" />優しい日本語へ。
          </h2>
          <p className="text-slate-600 text-lg">
            あなたの文章をAIがチェックし、意図せず誰かを傷つけたり、疎外感を与えたりする表現がないか確認します。
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setMode('text')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                mode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              テキスト入力
            </button>
            <button
              onClick={() => {
                if (isUrlFetchAvailable) {
                  setMode('url');
                  setErrorMessage(null);
                }
              }}
              disabled={!isUrlFetchAvailable}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${
                !isUrlFetchAvailable
                  ? 'text-slate-400 cursor-not-allowed'
                  : mode === 'url'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Link className="w-4 h-4" />
              URLから取得
            </button>
          </div>
        </div>
        {(!isAnalysisAvailable || !isUrlFetchAvailable) && (
          <div className="max-w-2xl mx-auto mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 space-y-1">
            {!isAnalysisAvailable && <p>{analysisDisabledMessage}</p>}
            {!isUrlFetchAvailable && <p>{urlFetchDisabledMessage} 分析したい本文を直接貼り付けてください。</p>}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-380px)] min-h-[600px]">
          {/* Left Column: Input */}
          <div className="flex flex-col gap-4">
            {errorMessage && mode === 'url' && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  記事のURL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button
                    onClick={handleFetchAndAnalyze}
                    disabled={!urlInput.trim() || isFetchingUrl || isAnalyzing}
                    className={`
                      px-6 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2
                      ${!urlInput.trim() || isFetchingUrl || isAnalyzing
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }
                    `}
                  >
                    {isFetchingUrl ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isFetchingUrl ? '取得中...' : '取得して分析'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {mode === 'url' && !errorMessage && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  記事のURL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/article"
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                  <button
                    onClick={handleFetchAndAnalyze}
                    disabled={!urlInput.trim() || isFetchingUrl || isAnalyzing}
                    className={`
                      px-6 py-2 rounded-lg font-bold shadow-md transition-all active:scale-95 flex items-center gap-2
                      ${!urlInput.trim() || isFetchingUrl || isAnalyzing
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }
                    `}
                  >
                    {isFetchingUrl ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    <span>{isFetchingUrl ? '取得中...' : '取得して分析'}</span>
                  </button>
                </div>
              </div>
            )}

            {errorMessage && mode === 'text' && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
                <button 
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <PenLine className="w-4 h-4" />
                {mode === 'url' ? 'Extracted Text' : 'Original Text'}
              </label>
              <div className="flex gap-2">
                {mode === 'text' && (
                  <button 
                      onClick={handlePaste}
                      className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
                      title="クリップボードから貼り付け"
                  >
                      <ClipboardPaste className="w-3 h-3" />
                      貼り付け
                  </button>
                )}
                <button 
                    onClick={handleCopyInput}
                    disabled={!inputText}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 disabled:opacity-30"
                    title="テキストをコピー"
                >
                    {copySuccess ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    コピー
                </button>
                {mode === 'text' && (
                  <>
                    <button 
                        onClick={handleLoadSample}
                        className="text-xs font-medium text-slate-500 hover:text-indigo-600 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                    >
                        サンプルを入力
                    </button>
                    <button 
                        onClick={handleReset}
                        className="text-xs font-medium text-slate-500 hover:text-red-600 px-3 py-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3" />
                        クリア
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative flex-1 group">
                <textarea
                  className="w-full h-full p-6 bg-white border border-slate-200 rounded-xl shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 text-lg leading-relaxed placeholder:text-slate-300"
                  placeholder={mode === 'url' ? "URLから取得したテキストがここに表示されます..." : "ここにチェックしたい日本語の文章を入力してください..."}
                  value={inputText}
                  readOnly={mode === 'url' && isFetchingUrl}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (hasAnalyzed) setHasAnalyzed(false); // Reset analyzed state on edit
                  }}
                  spellCheck={false}
                />
                {mode === 'text' && (
                  <div className="absolute bottom-6 right-6">
                      <button
                           onClick={() => handleAnalyze()}
                           disabled={isAnalyzeButtonDisabled}
                           className={`
                               flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all transform active:scale-95
                               ${isAnalyzeButtonDisabled
                                   ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                   : isAnalyzing
                                       ? 'bg-indigo-400 text-white cursor-wait'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-500/30'
                              }
                          `}
                      >
                           {isAnalyzing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                           ) : (
                               <Play className="w-4 h-4 fill-current" />
                           )}
                           <span>{analyzeButtonLabel}</span>
                       </button>
                   </div>
                )}
            </div>
          </div>

          {/* Right Column: Analysis */}
          <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                Analysis Results
              </label>
              {hasAnalyzed && issues.length > 0 && (
                <span className="text-xs font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full">
                  {issues.length} 件の改善点
                </span>
              )}
            </div>
            
            <div className="flex-1 h-full">
                <AnalysisViewer 
                    text={inputText} 
                    issues={issues} 
                    isLoading={isAnalyzing} 
                    hasAnalyzed={hasAnalyzed}
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
