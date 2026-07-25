/* ============================================================
   offline.js — Service Worker 註冊與更新提示
   file:// 環境不支援 Service Worker，會安靜略過。
   ============================================================ */
(function () {
  "use strict";

  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;

  function notify(message) {
    if (window.CodeRunner && typeof window.CodeRunner.toast === "function") {
      window.CodeRunner.toast(message);
    }
  }

  window.addEventListener("load", function () {
    navigator.serviceWorker.register("service-worker.js", { scope: "./" })
      .then(function (registration) {
        var refreshing = false;
        var hadController = !!navigator.serviceWorker.controller;

        navigator.serviceWorker.addEventListener("controllerchange", function () {
          if (refreshing) return;
          refreshing = true;
          if (hadController) {
            notify("網站已更新，重新整理後即可使用最新版本。");
          }
        });

        registration.addEventListener("updatefound", function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              notify("已在背景下載網站更新。");
            }
          });
        });
      })
      .catch(function (error) {
        // 離線功能失敗不應影響教材主功能；僅在開發工具留下診斷。
        if (window.console && console.warn) {
          console.warn("離線快取註冊失敗：", error);
        }
      });
  });
})();
