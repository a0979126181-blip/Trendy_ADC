import React, { useState, KeyboardEvent } from 'react';
import { Layout, Calendar, Clock, Mail, CheckCircle2, ArrowRight, Plus, FlaskConical, Play, X, Tag, Send, AlertTriangle, XCircle, Copy, ExternalLink } from 'lucide-react';
import { ReportResult, TimeFrame } from './types';
import { generateTrendReport } from './services/geminiService';
import { ReportView } from './components/ReportView';

const App: React.FC = () => {
  // Tag System State
  const [inputValue, setInputValue] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('any');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly'>('daily');
  const [time, setTime] = useState('09:00');
  const [email, setEmail] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Test/Preview State
  const [isTesting, setIsTesting] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  
  // Email Simulation & Guide State
  const [isSending, setIsSending] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const presets: { label: string; value: string }[] = [
    { label: '工業設計 (ID)', value: 'Industrial Design' },
    { label: 'CMF 設計', value: 'CMF Design' },
    { label: '使用者體驗 (UX)', value: 'User Experience' },
    { label: '模具與製程', value: 'Manufacturing Tooling' },
    { label: '介面設計 (UI)', value: 'User Interface' },
    { label: '包裝設計', value: 'Packaging Design' },
    { label: '視覺傳達', value: 'Visual Communication' },
  ];

  const timeOptions: { label: string; value: TimeFrame }[] = [
    { label: '不限時間', value: 'any' },
    { label: '過去一週', value: 'week' },
    { label: '過去一個月', value: 'month' },
    { label: '過去一年', value: 'year' },
    { label: '過去三年', value: '3years' },
  ];

  const addTopic = (topic: string) => {
    const trimmed = topic.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
    }
    setInputValue('');
  };

  const removeTopic = (topicToRemove: string) => {
    setSelectedTopics(selectedTopics.filter(t => t !== topicToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic(inputValue);
    }
  };

  const handleTest = async () => {
    if (!process.env.API_KEY) {
      alert("請在環境變數中設定 API_KEY。");
      return;
    }
    if (selectedTopics.length === 0 && !inputValue.trim()) {
      alert("請至少新增一個研究主題標籤。");
      return;
    }

    const topicsToRun = [...selectedTopics];
    if (inputValue.trim() && !topicsToRun.includes(inputValue.trim())) {
        topicsToRun.push(inputValue.trim());
        addTopic(inputValue); 
    }

    setIsTesting(true);
    setReportResult(null);

    try {
      const result = await generateTrendReport(topicsToRun, timeFrame);
      setReportResult(result);
    } catch (error) {
      console.error("Test generation failed", error);
      alert("測試報告生成失敗，請稍後再試。");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendEmailClick = () => {
    if (!email) {
      // Scroll to email input if empty
      const emailSection = document.getElementById('email-section');
      emailSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a shake effect or focus logic here if needed
      setTimeout(() => alert("請先在「步驟 3」填寫您的 Email 地址。"), 100);
      return;
    }
    setIsSending(true);
    // Simulate API delay
    setTimeout(() => {
        setIsSending(false);
        setShowEmailModal(true);
    }, 1200);
  };

  const handleSchedule = () => {
    if (selectedTopics.length === 0 && !inputValue.trim()) {
       alert("請設定研究主題。");
       return;
    }
    if (!email) {
      alert("請填寫 Email。");
      return;
    }
    
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsScheduled(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative">
      
      {/* Email Instruction Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-up">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <Mail className="text-indigo-400" />
                        郵件發送說明
                    </h3>
                    <button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-white transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                <div className="p-6 md:p-8 space-y-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <h4 className="font-bold text-yellow-800 flex items-center gap-2 mb-1">
                            <AlertTriangle size={18} />
                            為什麼您沒有收到信？
                        </h4>
                        <p className="text-yellow-700 text-sm leading-relaxed">
                            此網頁是前端介面，基於瀏覽器安全限制，<strong>無法直接寄出真實郵件</strong>。
                            要發送真實郵件，請使用專案中的 Python 腳本。
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 text-lg border-b pb-2">如何設定 Gmail 自動發信？</h4>
                        
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">1</div>
                            <div>
                                <p className="font-medium text-slate-800">啟用兩步驟驗證</p>
                                <p className="text-sm text-slate-500">前往 Google 帳戶安全性設定，確保「兩步驟驗證」已開啟。</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">2</div>
                            <div>
                                <p className="font-medium text-slate-800">取得應用程式密碼 (App Password)</p>
                                <p className="text-sm text-slate-500 mb-2">Google 不再允許程式使用您的「登入密碼」。</p>
                                <a 
                                    href="https://myaccount.google.com/apppasswords" 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-300"
                                >
                                    <ExternalLink size={12} />
                                    前往設定 Google 應用程式密碼
                                </a>
                                <p className="text-xs text-slate-400 mt-2">
                                    應用程式名稱隨便填 (例如 "Python Script")，然後複製那組 16 位代碼。
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">3</div>
                            <div>
                                <p className="font-medium text-slate-800">執行 Python 測試</p>
                                <p className="text-sm text-slate-500 mb-2">在您的終端機 (Terminal) 設定環境變數並執行：</p>
                                <div className="bg-slate-800 rounded-lg p-3 relative group">
                                    <code className="text-green-400 text-xs font-mono break-all block">
                                        export GMAIL_USER="{email || '您的Email'}"<br/>
                                        export GMAIL_PASSWORD="您的應用程式密碼"<br/>
                                        python daily_trend_reporter.py --test-email
                                    </code>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowEmailModal(false)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        我瞭解了
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Success View */}
      {isScheduled ? (
          <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-indigo-100">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">排程成功！</h2>
              <p className="text-slate-600 mb-6">
                您的 <strong>{scheduleType === 'daily' ? '每日' : '每週'}</strong> 報告 <br/>
                主題：<span className="text-indigo-600 font-medium">{selectedTopics.join(', ') || inputValue}</span> <br/>
                將於 <strong>{time}</strong> 發送至 <strong>{email}</strong>。
              </p>
              <button 
                onClick={() => { setIsScheduled(false); setReportResult(null); setSelectedTopics([]); setInputValue(''); }}
                className="bg-slate-100 text-slate-700 font-medium px-6 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                設定新的排程
              </button>
            </div>
          </div>
      ) : (
        <>
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col items-center justify-center shadow-sm">
                <div className="flex items-center gap-3 mb-1">
                <div className="bg-indigo-600 p-2 rounded-lg">
                    <Layout className="text-white h-6 w-6" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trendy ADC</h1>
                </div>
                <p className="text-sm text-slate-500 font-medium">自動化趨勢報告系統</p>
            </header>

            <main className="max-w-4xl mx-auto p-8">
                
                <div className="space-y-10 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                
                {/* Section 1: Research Topic */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                    <label className="block text-lg font-bold text-slate-800">
                        研究主題 (標籤)
                    </label>
                    <span className="text-xs uppercase font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">步驟 1</span>
                    </div>
                    
                    {/* Tag Input Area */}
                    <div className="mb-4 bg-slate-800 border-2 border-slate-700 rounded-xl p-2 flex flex-wrap gap-2 focus-within:border-indigo-500 transition-colors min-h-[60px] items-center">
                    {selectedTopics.map((tag) => (
                        <span key={tag} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 animate-fade-in">
                        {tag}
                        <button onClick={() => removeTopic(tag)} className="hover:bg-indigo-700 rounded-full p-0.5 transition-colors">
                            <X size={14} />
                        </button>
                        </span>
                    ))}
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedTopics.length === 0 ? "輸入自定義主題後按 Enter..." : "新增更多..."}
                        className="bg-transparent text-white placeholder-slate-400 outline-none flex-1 min-w-[150px] px-2 py-1 text-lg"
                    />
                    </div>

                    {/* Time Frame Selector */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-500 mb-2">資料時間範圍</label>
                        <div className="flex flex-wrap gap-2">
                            {timeOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTimeFrame(opt.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                        timeFrame === opt.value
                                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => (
                        <button
                        key={preset.value}
                        onClick={() => addTopic(preset.value)}
                        disabled={selectedTopics.includes(preset.value)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1 ${
                            selectedTopics.includes(preset.value)
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        >
                        <Plus size={12} />
                        {preset.label}
                        </button>
                    ))}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 ml-1">
                        * 點擊預設標籤或在上方輸入自定義主題 (按 Enter 新增)
                    </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 2: Schedule */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                    <label className="block text-lg font-bold text-slate-800">
                        排程設定
                    </label>
                    <span className="text-xs uppercase font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">步驟 2</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setScheduleType('daily')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            scheduleType === 'daily' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Calendar size={18} />
                            每日
                        </button>
                        <button 
                            onClick={() => setScheduleType('weekly')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            scheduleType === 'weekly' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Calendar size={18} />
                            每週
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3">
                            <Clock size={18} className="text-slate-400" />
                            <input 
                            type="time" 
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="bg-transparent font-medium text-slate-700 outline-none"
                            />
                        </div>
                    </div>
                    </div>
                </section>

                <hr className="border-slate-100" />

                {/* Section 3: Email */}
                <section id="email-section">
                    <div className="flex items-center justify-between mb-4">
                    <label className="block text-lg font-bold text-slate-800">
                        Email 寄送
                    </label>
                    <span className="text-xs uppercase font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">步驟 3</span>
                    </div>
                    
                    <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="輸入您的 Email 地址"
                        // UPDATED: Dark background with white text for better visibility as requested
                        className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl pl-12 pr-4 py-3 text-lg text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-0 outline-none transition-colors"
                    />
                    </div>
                </section>

                {/* Footer Action */}
                <div className="pt-4 flex flex-col md:flex-row gap-4">
                    {/* Test Button */}
                    <button 
                        onClick={handleTest}
                        disabled={isTesting || isProcessing}
                        className="flex-1 bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-lg font-bold py-4 rounded-xl shadow-sm transition-all active:scale-[0.99] flex items-center justify-center gap-3"
                    >
                        {isTesting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            生成預覽中...
                        </>
                        ) : (
                        <>
                            <FlaskConical size={24} />
                            測試執行
                        </>
                        )}
                    </button>

                    {/* Confirm Schedule Button */}
                    <button 
                        onClick={handleSchedule}
                        disabled={isProcessing || isTesting}
                        className="flex-[2] bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3"
                    >
                        {isProcessing ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            排程中...
                        </>
                        ) : (
                        <>
                            確認排程
                            <ArrowRight size={20} />
                        </>
                        )}
                    </button>
                </div>
                </div>

                {/* Live Preview Result Section */}
                {reportResult && (
                <div className="mt-8 animate-fade-in-up pb-12">
                    <div className="flex items-center gap-2 mb-4">
                    <Play size={20} className="text-indigo-600" />
                    <h3 className="text-xl font-bold text-slate-800">測試執行預覽</h3>
                    </div>
                    <ReportView result={reportResult} />

                    {/* Email Test Button */}
                    <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                        <div className="text-slate-600 text-sm">
                            <p className="font-bold text-slate-800 mb-1">對這份報告滿意嗎？</p>
                            <p>點擊右側按鈕測試發送 (包含 Gmail API 設定教學)。</p>
                        </div>
                        <button
                            onClick={handleSendEmailClick}
                            disabled={isSending}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isSending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    模擬連線中...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    發送預覽至信箱
                                </>
                            )}
                        </button>
                    </div>
                </div>
                )}

            </main>
        </>
      )}
    </div>
  );
};

export default App;