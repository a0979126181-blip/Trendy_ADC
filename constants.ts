import { TrendTab, Strategy } from './types';

export const STRATEGIES: Record<TrendTab, Strategy> = {
  CMF: {
    description: "Color, Material, and Finish Analysis",
    keywords: [
      "innovative materials consumer electronics 2025",
      "new surface finishing trends tech",
      "sustainable CMF design",
      "eco-friendly electronic materials"
    ],
    filterCriteria: "專注於材質創新、塗層工藝、觸感或色彩趨勢。"
  },
  ID: {
    description: "Industrial Design & Form Factors",
    keywords: [
      "consumer electronics industrial design trends",
      "new form factor smartphones",
      "minimalist hardware aesthetics",
      "ergonomic electronics design"
    ],
    filterCriteria: "專注於造型語彙、人體工學、使用者互動介面。"
  },
  TOOLING: {
    description: "Manufacturing & Prototyping",
    keywords: [
      "injection molding innovation electronics",
      "CNC machining techniques for prototypes",
      "new manufacturing process tech",
      "additive manufacturing electronics"
    ],
    filterCriteria: "專注於生產製程、量產工藝解決方案或原型製作技術。"
  },
  UX: {
    description: "User Experience & Interaction",
    keywords: [
      "user experience trends consumer electronics",
      "HMI innovation 2025",
      "gesture control technology",
      "voice interface trends"
    ],
    filterCriteria: "專注於使用者體驗、人機介面、互動設計創新。"
  },
  UI: {
    description: "User Interface Design",
    keywords: [
      "mobile app UI trends 2025",
      "consumer electronics interface design",
      "digital product design trends",
      "spatial computing UI patterns"
    ],
    filterCriteria: "專注於螢幕介面設計、視覺層次、動效與圖形使用者介面。"
  },
  PACKAGE: {
    description: "Packaging Design",
    keywords: [
      "sustainable electronics packaging trends",
      "unboxing experience design",
      "innovative packaging materials",
      "minimalist packaging structures"
    ],
    filterCriteria: "專注於包裝結構、材質永續性、開箱體驗設計。"
  },
  VISUAL_COMM: {
    description: "Visual Communication",
    keywords: [
      "tech brand visual identity trends",
      "consumer electronics marketing visuals",
      "3D motion graphics for tech products",
      "typography trends in technology"
    ],
    filterCriteria: "專注於品牌識別、視覺傳達、行銷視覺與動態圖像設計。"
  },
  Custom: {
    description: "Custom Topic Analysis",
    keywords: [],
    filterCriteria: "根據使用者自定義主題進行篩選。"
  }
};