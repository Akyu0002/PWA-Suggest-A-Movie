const version = 2;
let isOnline = true;
const staticCache = `PWACache${version}`;
const dynamicCache = `PWADynamicCache${version}`;
const cacheLimit = 100;
const cacheList = [
  "/",
  //HTML Files
  "/index.html",
  "/results.html",
  "/404.html",
  "/suggest.html",
  // CSS File
  "./css/main.css",
  // Main JS
  "./js/app.js",
  // Images
  "./img/home-icon-silhouette-svgrepo-com.svg",
  "/img/Online.svg",
  "/img/Offline.svg",
  "./img/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg",
  "./img/GrumpyCat.png",
  // Font
  "https://fonts.googleapis.com/css2?family=Raleway:wght@300;500&display=swap",
  // Bootstrap
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
  // Favicons
];

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(staticCache).then((cache) => {
      cache.addAll(cacheList);
    })
  );
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => {
              if (key === staticCache || key === dynamicCache) {
                return false;
              } else {
                return true;
              }
            })
            .map((key) => caches.delete(key))
        );
      })
      .catch(console.warn)
  );
});

self.addEventListener("fetch", (ev) => {
  // console.log(ev)
  ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(ev.request)
          .then((fetchRes) => {
            // console.log(fetchRes);
            if (fetchRes.status > 399) throw new Error(fetchRes.statusText);

            return caches.open(dynamicCache).then((cache) => {
              let copy = fetchRes.clone();
              cache.put(ev.request, copy);
              limitCacheSize(dynamicCache, 60);
              return fetchRes;
            });
          })
          .catch((err) => {
            console.log("SW fetch failed");
            console.warn(err);
            if (ev.request.mode === "navigate") {
              return caches.match("/404.html").then((cacheRes) => {
                return cacheRes;
              });
            }
          })
      );
    })
  );
});

self.addEventListener("message", (ev) => {
  console.log(ev.data);

  if (ev.data.ONLINE) {
    isOnline = ev.data.ONLINE;
  }
});

function sendMessage(msg) {
  self.clients.matchAll().then(function (clients) {
    if (clients && clients.length) {
      clients[0].postMessage(msg);
    }
  });
}

function limitCacheSize(nm, size) {
  //remove some files from the dynamic cache
  caches.open(nm).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > size) {
        cache.delete(keys[0]).then(() => {
          limitCacheSize(nm, size);
        });
      }
    });
  });
}

function checkForConnection() {
  //try to talk to a server and do a fetch() with HEAD method.
  //to see if we are really online or offline
  //send a message back to the browser
  self.clients.matchAll().then(function (clients) {
    if (clients && clients.length) {
      //Respond to last focused tab
      clients[0].postMessage(msg);
    }
  });
}
