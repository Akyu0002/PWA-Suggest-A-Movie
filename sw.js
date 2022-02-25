const version = 1;
let isOnline = "onLine" in navigator && navigator.onLine;
const staticCache = `PWA-Cache${version}`;
const dynamicCache = `PWA-DynamicCache${version}`;
const imgDynamicCache = `PWA-DyanmicImageCache${version}`;
const cacheLimit = 40;
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
  "./img/SAM.svg",
  "./img/404 SAM.svg",
  "./img/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg",
  // Font
  "https://fonts.googleapis.com/css2?family=Raleway:wght@300;500&display=swap",
  // Bootstrap
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js",
  // Icons + Favicon
  "./img/android-chrome-512x512.png",
  "./img/android-chrome-192x192.png",
  "./img/android-chrome-48x48.png",
  "./img/apple-touch-icon.png",
  "./img/mstile-150x150.png",
  "./img/favicon-16x16.png",
  "./img/favicon-32x32.png",
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
  ev.respondWith(
    caches.match(ev.request).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(ev.request)
          .then((fetchRes) => {
            //TODO: check here for the 404 error
            // Make a third cache for images only
            if (fetchRes.status > 399) throw new Error(fetchRes.statusText);

            if (fetchRes.type === "opaque") {
              return caches.open(imgDynamicCache).then((cache) => {
                let copy = fetchRes.clone(); //make a copy of the response
                cache.put(ev.request, copy); //put the copy into the cache

                cache.keys().then((key) => {
                  if (key.length > cacheLimit) {
                    limitCacheSize(imgDynamicCache);
                  }
                });
                return fetchRes; //send the original response back up the chain
              });
            } else {
              return caches.open(dynamicCache).then((cache) => {
                let copy = fetchRes.clone(); //make a copy of the response
                cache.put(ev.request, copy); //put the copy into the cache
                return fetchRes; //send the original response back up the chain
              });
            }
          })
          .catch(async (err) => {
            console.log("SW fetch failed");
            console.warn(err);
            if (ev.request.mode == "navigate") {
              //send the 404 page
              return caches.match("/404.html").then((page404Response) => {
                return page404Response;
              });
            }
          })
      );
    })
  ); //what do we want to send to the browser?
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

function limitCacheSize(nm, size = 40) {
  //remove some files from the dynamic cache

  return caches.open(nm).then((cache) => {
    return cache.keys().then((keys) => {
      let numOfKeys = keys.length;
      if (numOfKeys > size) {
        return cache.delete(keys[numOfKeys - 1]).then(() => {
          return limitCacheSize(nm, size);
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
class NetworkError extends Error {
  constructor(msg, status, statusText) {
    super(msg);
    this.status = status;
    this.statusText = statusText;
  }
}
