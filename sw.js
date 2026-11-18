// Lectra スマホ版の Service Worker。
// アプリ本体（同じ場所から配られるファイル）を端末に取っておき、電波がなくても開けるようにする。
// 辞書・翻訳・AI・pCloud など外部への通信には手を出さない。
const CACHE = "lectra-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  // まずネットワーク（新しい版を取りこぼさない）。だめなら取っておいたものを返す
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          void caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit ?? caches.match("./index.html"))),
  );
});
