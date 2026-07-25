# 品質檢核報告

- 檢核日期：2026-07-25
- 檢核範圍：離線快取功能、案例資料完整性、搜尋、手機版基本版面
- 測試環境：本機 HTTP Server、Chromium（Playwright）、375 × 812 px

## 自動檢核結果

| 項目 | 預期 | 結果 |
| --- | --- | --- |
| JavaScript 語法 | 所有 `js/*.js` 與 `service-worker.js` 通過 | ✅ |
| 案例資料 | 509 筆，id 不重複 | ✅ 509 / 509 |
| 預快取檔案 | 清單內路徑全部存在 | ✅ 52 / 52 |
| Service Worker | 註冊、啟用並控制頁面 | ✅ |
| 離線重新載入 | 斷線後首頁與 509 筆案例仍可使用 | ✅ |
| 離線縮圖 | 精選案例縮圖可由快取讀取 | ✅ HTTP 200 |
| 搜尋 | 「折射」回傳 3 筆案例 | ✅ |
| 手機版寬度 | 375 px 無整頁水平溢出 | ✅ |
| 執行期錯誤 | 無未捕捉 JavaScript 錯誤 | ✅ |

## 離線功能邊界

- Service Worker 僅在 HTTP(S) 環境啟用；`file://` 仍可使用原有核心功能，但沒有離線快取。
- Prism.js 與 Three.js、GSAP、p5.js、Matter.js、Chart.js 等第三方 CDN 不納入本站快取；依賴這些程式庫的案例離線時仍無法執行。
- 物理教材公式與互動的詳細驗證結果另見根目錄 `AUDIT.md`。

## 物理教材回歸稽核

- 稽核腳本：`scripts/audit-physics.js`
- 公式數值驗算：✅ 24 / 24
- 免 CDN 可操作性：✅ 20 / 20
- 正式網站 CDN 煙霧測試：✅ 12 / 12
- 人工線上驗證清單：`docs/cdn-physics-online-checklist.md`

CDN 煙霧測試已從正式 GitHub Pages 讀取目前發布的案例程式碼，確認 p5.js、Matter.js 與 Three.js 的載入、Canvas/WebGL 渲染、動畫影格變化及基本互動。物理現象的方向、順序與教學合理性仍須依人工清單判讀。
