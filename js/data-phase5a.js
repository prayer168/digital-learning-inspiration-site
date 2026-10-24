/* ============================================================
   data-phase5a.js — GuardAI 防詐教育科技案例
   收錄正式網站與競賽展示入口；不複製或重新發布原站程式碼。
   ============================================================ */
(function () {
  "use strict";
  if (!window.__P2 || !window.__P2mk) return;

  window.__P2.push(window.__P2mk({
    id: "edu-001",
    title: "GuardAI 反詐守門員：AI 查證素養學習平台",
    titleEn: "GuardAI Anti-Scam Verification Learning Platform",
    type: "互動學習平台",
    subjects: ["資訊教育", "人工智慧", "生活安全", "跨領域學習"],
    topics: ["反詐教育", "生成式 AI", "查證能力", "資訊素養", "媒體識讀"],
    gradeLevels: ["國中", "高中職", "成人學習"],
    difficulty: "初階",
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "OpenAI API", "Zod"],
    interactionTypes: ["文字分析", "情境闖關", "前後測", "查證練習"],
    libraries: [],
    offlineFriendly: false,
    mobileFriendly: true,
    tabletFriendly: true,
    accessible: true,
    featured: true,
    description: "以生成式 AI 陪伴使用者練習辨認可疑訊息線索、提出查證問題、選擇安全行動並向可信任的人求助。平台提供 AI 判讀實驗室、防詐闖關、學習護照、教師摘要與競賽展示模式。分析結果是初步學習提示，不是警方、金融機構或法律上的最終認定。",
    teachingApplication: "可用於班會、資訊素養、媒體識讀或家庭共學。教師先帶學生練習「停、看、問、查、求」五步驟，再用正常訊息與可疑訊息情境比較查證方法。學生操作後說明原文證據、查證問題和安全下一步；教師可用前後測與匿名班級摘要引導反思。若畫面標示「Demo 模擬資料」，數字只用來展示介面，不代表真實班級成果。",
    learningObjectives: [
      "能從訊息中指出具體風險線索，而非只依賴 AI 分數。",
      "能提出可透過獨立官方管道確認的查證問題。",
      "能選擇暫停操作、獨立查證或向可信任成人求助等安全行動。"
    ],
    teacherGuide: "建議先用「防詐闖關」完成一題作為引起動機，再示範判讀實驗室。提醒學生不要貼入姓名、電話、帳號、密碼、信用卡或驗證碼；使用練習案例時，確認 AI 模式標籤是「即時 AI」或「安全 Demo」。教師專區中的模擬統計不得當作真實成效引用。",
    studentTask: "挑選一則合成訊息情境，標出至少三個線索，寫下三個查證問題，選出一項安全行動，最後用自己的話說明哪一個官方管道能獨立確認。",
    extensions: [
      "比較假客服、冒名親友、投資或包裹通知等不同情境的共通操控線索。",
      "檢查 AI 提供的原文證據是否真的出現在訊息中，並討論不確定結果的意義。",
      "需要正式防詐公告、查詢或諮詢時，改用 165 全民防騙網及官方聯絡管道。"
    ],
    techAnalysis: "網站把輸入視為待分析資料，先執行常見敏感資訊遮罩與匿名用量限制，再使用伺服器端即時 AI 或安全 Demo 引擎。結構化輸出經 JSON Schema 與 Zod 驗證，並提供不確定性與錯誤備援。是否使用即時 AI 以網站當下的模式標示為準。",
    performanceNotes: "此為線上網站，完整功能需要網路。競賽展示另提供可下載的單檔離線 Demo；離線案例展示不代表即時 AI 可在沒有網路時運作。",
    mobileNotes: "核心流程支援手機版；課堂投影或高齡共學可放大瀏覽器文字。不同裝置與瀏覽器仍建議上課前測試。",
    accessibilityNotes: "網站以繁體中文、大字與高對比介面呈現主要學習流程；實際課堂使用可搭配教師口述與逐步操作，並依學生需求提供輔助。",
    modifyTips: [
      "先開啟正式網站了解完整功能，再用競賽展示模式依步驟導覽。",
      "本案例提供外部網站連結，不在本資料庫嵌入或複製 GuardAI 的原始程式碼。",
      "正式求助或確認詐騙資訊時，請以 165 與相關機構的官方管道為準。"
    ],
    referenceUrl: "https://guardai-olive.vercel.app/",
    license: "GuardAI 外部網站資源；網站內容及程式碼由原專案維護，本案例僅整理教學應用與連結。",
    tags: ["GuardAI", "防詐", "反詐教育", "查證素養", "生成式 AI", "資訊素養", "教育科技"],
    externalSite: {
      name: "GuardAI 反詐守門員",
      org: "GuardAI 教育科技專案",
      url: "https://guardai-olive.vercel.app/",
      demoUrl: "https://guardai-olive.vercel.app/showcase",
      needAccount: "一般判讀與練習免建立個人帳號；班級功能依網站當前流程操作",
      free: "公開瀏覽；即時 AI 可用性依網站模式及服務額度而定",
      chinese: "繁體中文",
      mobile: "支援手機、平板與桌機",
      techGuess: "依 GuardAI 專案資訊，使用 Next.js、TypeScript、Tailwind CSS、OpenAI API 與 Zod。",
      notes: "不輸入真實個資或驗證碼。分析結果不是正式認定；如需查證或求助，請改走 165 與官方管道。"
    }
  }));
})();
