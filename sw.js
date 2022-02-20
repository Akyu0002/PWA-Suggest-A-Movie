const version = 1;
let isOnline = true; 
const staticCache = `PWACache${version}`;
const dynamicCache = `PWADynamicCache${version}`;
const cacheLimit = 100;
const cacheList = [
  '/',
  '/index.html',
  '/results.html',
  '/404.html',
  '/suggest.html',
  './css/main.css',
  './js/app.js',
  './img/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg',
  "./img/GrumpyCat.png",
  "https://fonts.googleapis.com/css2?family=Raleway:wght@300;500&display=swap",
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(staticCache).then((cache) => {
      cache.addAll(cacheList);
    })
  );
});

self.addEventListener('activate', (ev) => {
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

self.addEventListener('fetch', (ev) => {
  // console.log(ev)
  
  ev.respondWith(
    caches.match(ev.request)

    .then((cacheRes) => {
      return (
        cacheRes ||
        fetch(ev.request)
          .then ((fetchRes) => {
            // console.log(fetchRes)
            // if (!fetchRes.ok) throw new Error(fetchRes.statusText)

            return caches.open(dynamicCache).then((cache) => {
                let copy = fetchRes.clone();
                cache.put(ev.request, copy);
              return fetchRes;
            });
          })
          .catch((err) => {
            // console.log('SW fetch failed');
            // console.warn(err);
            if(ev.request.mode === 'navigate') {
              return caches.match('/404.html').then(cacheRes => {
                return cacheRes
              })

            }
          })
      );
    })
  );
});

self.addEventListener('message', (ev) => {
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

function limitCache(){
  //remove some files from the dynamic cache
}

function checkForConnection(){
  //try to talk to a server and do a fetch() with HEAD method.
  //to see if we are really online or offline
  //send a message back to the browser
}
