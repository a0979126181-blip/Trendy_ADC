import { GoogleGenAI } from "@google/genai";
import { ReportResult, ReportItem, TimeFrame } from '../types';

export const generateTrendReport = async (topics: string[], timeFrame: TimeFrame = 'any'): Promise<ReportResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Calculate date range for the prompt
  const today = new Date();
  let startDateStr = "";
  const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

  switch (timeFrame) {
    case 'week':
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      startDateStr = `之後 (${lastWeek.toLocaleDateString('zh-TW', dateOptions)})`;
      break;
    case 'month':
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      startDateStr = `之後 (${lastMonth.toLocaleDateString('zh-TW', dateOptions)})`;
      break;
    case 'year':
      const lastYear = new Date(today);
      lastYear.setFullYear(today.getFullYear() - 1);
      startDateStr = `之後 (${lastYear.toLocaleDateString('zh-TW', dateOptions)})`;
      break;
    case '3years':
      const last3Years = new Date(today);
      last3Years.setFullYear(today.getFullYear() - 3);
      startDateStr = `之後 (${last3Years.toLocaleDateString('zh-TW', dateOptions)})`;
      break;
    default:
      startDateStr = "不限，但請優先選擇最新的資訊";
  }

  const topicStr = topics.join(', ');
  
  const prompt = `
    你是一位嚴謹的消費電子趨勢分析師。請全程使用「繁體中文」。

    【當前日期】：${today.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })}
    
    【任務目標】：
    針對主題標籤：[${topicStr}] 進行 Google 深度搜尋。
    
    【嚴格篩選規則 - 避免連結失效】：
    1. **絕對禁止猜測網址**：你必須只使用 Google Search Tool 回傳結果中真實存在的 URL。如果搜尋結果中沒有合適連結，請不要自行編造。
    2. **連結測試**：在輸出之前，請確認該網址看起來是完整的文章頁面 (例如結尾是 .html, 或包含 /article/, /news/ 等路徑)，而不是首頁。
    3. **來源多樣性**：回傳的 3 篇文章 **必須來自不同的網站域名** (Different Domains)。
    4. **時間範圍**：只選擇發布日期在「${startDateStr}」之後的新聞。
    5. **排除名單**：排除 Pinterest, Amazon, 蝦皮, 淘寶等購物網站。

    請找出 3 篇最具啟發性的文章，並回傳以下 JSON 格式 (不要 Markdown 標記，純 JSON)：

    [
      {
        "title": "文章標題 (請翻譯成繁體中文)",
        "url": "真實連結 URL (請直接複製搜尋結果中的連結，不要修改)",
        "source": "來源網站名稱 (例如: The Verge)",
        "date": "文章發布日期 (例如: 2024-10-15)",
        "summary": "繁體中文總結 (約 80 字，說明該趨勢的創新點)",
        "tags": ["相關標籤1", "相關標籤2"]
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || "[]";
    let items: ReportItem[] = [];
    
    try {
        items = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse JSON", e);
        const match = text.match(/\[.*\]/s);
        if (match) {
            try {
                items = JSON.parse(match[0]);
            } catch (e2) {
                console.error("Failed to parse extracted JSON", e2);
            }
        }
    }

    return {
      topics,
      reportDate: today.toLocaleDateString('zh-TW'),
      items
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};