/* ============================================================
   service-worker.js — GitHub Pages 離線快取
   首次連線後預先保存網站殼層、完整案例資料與精選縮圖。
   ============================================================ */
"use strict";

var CACHE_PREFIX = "digital-learning-inspiration-";
var CACHE_VERSION = "v4";
var APP_CACHE = CACHE_PREFIX + CACHE_VERSION;

var APP_SHELL = [
  "./",
  "./index.html",
  "./README.md",
  "./assets/images/social-preview.png",
  "./css/style.css",
  "./css/components.css",
  "./css/responsive.css",
  "./js/data-phase2.js",
  "./js/data-phase2b.js",
  "./js/data-phase2c.js",
  "./js/data-phase3a.js",
  "./js/data-phase3b.js",
  "./js/data-phase3c.js",
  "./js/data-phase3d.js",
  "./js/data-phase4a.js",
  "./js/data-phase4b.js",
  "./js/data-phase4c.js",
  "./js/data-phase4d.js",
  "./js/data-phase4e.js",
  "./js/data-phase5a.js",
  "./js/data.js",
  "./js/thumbnails.js",
  "./js/theme.js",
  "./js/favorites.js",
  "./js/filters.js",
  "./js/code-runner.js",
  "./js/app.js",
  "./js/offline.js",
  "./assets/thumbnails/css-001.png",
  "./assets/thumbnails/css-005.png",
  "./assets/thumbnails/css-010.png",
  "./assets/thumbnails/css-016.png",
  "./assets/thumbnails/css-017.png",
  "./assets/thumbnails/css-020.png",
  "./assets/thumbnails/css-023.png",
  "./assets/thumbnails/cv-002.png",
  "./assets/thumbnails/cv-004.png",
  "./assets/thumbnails/js-001.png",
  "./assets/thumbnails/js-003.png",
  "./assets/thumbnails/js-008.png",
  "./assets/thumbnails/sci-001.png",
  "./assets/thumbnails/sci-002.png",
  "./assets/thumbnails/sci-003.png",
  "./assets/thumbnails/sci-005.png",
  "./assets/thumbnails/sci-008.png",
  "./assets/thumbnails/svg-005.png",
  "./assets/thumbnails/svg-006.png",
  "./assets/thumbnails/svg-007.png",
  "./assets/thumbnails/svg-009.png",
  "./assets/thumbnails/td-006.png",
  "./assets/thumbnails/td-007.png",
  "./assets/thumbnails/td-008.png",
  "./assets/thumbnails/td-010.png",
  "./assets/thumbnails/td-014.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(function (cache) { return cache.addAll(APP_SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key.indexOf(CACHE_PREFIX) === 0 && key !== APP_CACHE) {
            return caches.delete(key);
          }
          return Promise.resolve(false);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function cacheResponse(request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return Promise.resolve(response);
  }
  var copy = response.clone();
  return caches.open(APP_CACHE)
    .then(function (cache) { return cache.put(request, copy); })
    .then(function () { return response; });
}

function networkFirstNavigation(request) {
  return fetch(request)
    .then(function (response) { return cacheResponse(request, response); })
    .catch(function () {
      return caches.match(request)
        .then(function (response) {
          return response || caches.match("./index.html");
        });
    });
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(function (cached) {
    var network = fetch(request)
      .then(function (response) { return cacheResponse(request, response); })
      .catch(function () { return cached; });
    return cached || network;
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET" || request.headers.has("range")) return;

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});
