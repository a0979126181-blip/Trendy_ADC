import React from 'react';
import { ReportResult } from '../types';
import { ExternalLink, Calendar, Globe, Tag } from 'lucide-react';

interface ReportViewProps {
  result: ReportResult;
}

export const ReportView: React.FC<ReportViewProps> = ({ result }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 mr-2">
               趨勢報告
            </h2>
            {result.topics.map((topic, i) => (
                <span key={i} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                  {topic}
                </span>
            ))}
          </div>
          <div className="flex items-center text-slate-500 text-sm gap-2 whitespace-nowrap">
            <Calendar size={16} />
            報告日期：{result.reportDate}
          </div>
        </div>

        <div className="space-y-8">
          {result.items.map((item, index) => (
            <div key={index} className="flex flex-col gap-4 p-5 rounded-xl bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
              <div className="flex flex-col gap-2">
                 <div className="flex items-start justify-between gap-4">
                     <h3 className="text-xl font-bold text-slate-800 leading-snug">
                       <span className="text-indigo-500 mr-2">#{index + 1}</span>
                       {item.title}
                     </h3>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mb-2">
                    <div className="flex items-center gap-1">
                        <Globe size={12} />
                        {item.source || 'Unknown Source'}
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {item.date || 'N/A'}
                    </div>
                 </div>

                 <p className="text-slate-600 leading-relaxed text-sm bg-white p-3 rounded-lg border border-slate-100">
                     {item.summary}
                 </p>
                 
                 {/* Article Tags */}
                 {item.tags && item.tags.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-1">
                         {item.tags.map((tag, tIdx) => (
                             <span key={tIdx} className="flex items-center gap-1 text-[10px] uppercase tracking-wider bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
                                 <Tag size={10} />
                                 {tag}
                             </span>
                         ))}
                     </div>
                 )}
              </div>
              
              {/* Simulation of the Screenshot functionality */}
              {/* Note: We use a placeholder logic here. If URL is likely broken (empty), we show warning */}
              {item.url && item.url !== 'null' ? (
                  <div className="mt-2 relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-200 h-56 flex items-center justify-center">
                     <img 
                        src={`https://picsum.photos/seed/${index + item.url}/800/400`} 
                        alt="Simulated Webpage Screenshot"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                     />
                     <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-white text-slate-900 px-5 py-2.5 rounded-full font-bold shadow-xl transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all flex items-center gap-2 hover:bg-indigo-50"
                        >
                          <ExternalLink size={16} />
                          閱讀原文
                        </a>
                     </div>
                     <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                        系統截圖 (模擬)
                     </div>
                  </div>
              ) : (
                  <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                      <ExternalLink size={16} />
                      無效的連結或來源已被移除
                  </div>
              )}
            </div>
          ))}
          {result.items.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                  <p>未找到符合條件的近期文章，請嘗試放寬時間範圍或更換關鍵字。</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};