const CACHE_NAME = "zytron-drop-v1";
const DB_NAME = "zytron_drop_share_db";
const STORE_NAME = "incoming";

function openShareDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveSharedPayload(payload) {
  const db = await openShareDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id: "latest", ...payload, timestamp: Date.now() });
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Intercept Native OS Share Sheet ("Zytron Drop") POST payload
  if (event.request.method === "POST" && url.searchParams.has("shared")) {
    event.respondWith(
      (async () => {
        try {
          const formData = await event.request.formData();
          const title = formData.get("title") || "";
          const text = formData.get("text") || "";
          const sharedUrl = formData.get("url") || "";
          const rawFiles = formData.getAll("files");
          const files = [];

          for (const item of rawFiles) {
            if (item && typeof item.arrayBuffer === "function") {
              files.push({
                name: item.name || "gedeeld-bestand",
                type: item.type || "application/octet-stream",
                size: item.size || 0,
                blob: item,
              });
            }
          }

          await saveSharedPayload({
            title: String(title),
            text: String(text),
            url: String(sharedUrl),
            files,
          });

          return Response.redirect("/?incoming_share=1", 303);
        } catch (err) {
          return Response.redirect("/?incoming_share=error", 303);
        }
      })()
    );
    return;
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});

