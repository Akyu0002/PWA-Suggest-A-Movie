const APP = {
  DB: null, //the indexedDB
  isONLINE: "onLine" in navigator && navigator.onLine,
  KEY: "883762e0241bf7da58c9cb6546739dea",
  baseURL: "https://api.themoviedb.org/3/",
  imgURL: "",
  results: [],
  movieID: "",
  searchInput: "",
  init: () => {
    //when the page loads
    //open the database
    APP.openDatabase(APP.registerSW); //register the service worker after the DB is open
  },
  registerSW: () => {
    console.log("Registering Service Worker");
    //register the service worker
    navigator.serviceWorker.register("/sw.js").catch(function (err) {
      console.warn(err);
    });

    navigator.serviceWorker.ready.then((registration) => {
      registration.active;
    });

    //then add listeners and run page specific code
    APP.addListeners();
    APP.pageSpecific();
  },
  openDatabase: (nextStep) => {
    let version = 1;
    //open the database
    let dbOpenRequest = indexedDB.open("pwaDB", version);
    //add the update, error, success listeners in here
    dbOpenRequest.onupgradeneeded = function (ev) {
      APP.DB = ev.target.result;

      try {
        APP.DB.deleteObjectStore("searchStore");
        APP.DB.deleteObjectStore("reccStore");
      } catch {
        console.warn("Can't delete DB's, they might not exist yet!");
      }
      //create searchStore with keyword as keyPath
      APP.DB.createObjectStore("searchStore", {
        keyPath: "keyword",
        autoIncrement: false,
      });
      //create suggestStore with movieid as keyPath
      APP.DB.createObjectStore("reccStore", {
        keyPath: "movieID",
        autoIncrement: false,
      });
    };

    dbOpenRequest.onerror = function (err) {
      console.log(err.message);
    };

    //call nextStep onsuccess
    dbOpenRequest.onsuccess = function (ev) {
      APP.DB = dbOpenRequest.result;
      console.log(`${APP.DB.name} is ready to be used!`);
      nextStep();
    };
  },
  createTransaction: (storeName) => {
     //create a transaction to use for some interaction with the database
    let tx = APP.DB.transaction(storeName, "readwrite");
    return tx;
  },
  getDBResults: (storeName, keyValue) => {
    //return the results from storeName where it matches keyValue
    console.log("Sending data from IDB")
    let dbTx = APP.createTransaction(storeName)
    let store = dbTx.objectStore(storeName)
    console.log(store)
    let dbResults = store.get(keyValue)

    console.log(dbResults)

  },
  addResultsToDB: (obj, storeName) => {
    //pass in the name of the store
    let tx = APP.createTransaction(storeName)
    let store = tx.objectStore(storeName);
    let newObj = {
      keyword: APP.searchInput,
      results: obj
    }
   
    //save the obj passed in to the appropriate store
    store.add(newObj)
  },
  addListeners: () => {
    //add listeners
    //when the search form is submitted
    let search = document.getElementById("btnSearch");
    search.addEventListener("click", APP.searchFormSubmitted);

    //when clicking on the list of possible searches on home or 404 page
    //when a message is received
    //when online and offline
    window.addEventListener("online", APP.changeStatus);
    window.addEventListener("offline", APP.changeStatus);
  },
  pageSpecific: () => {
    //anything that happens specifically on each page
    if (document.body.id === "home") {
      //on the home page
    }
    if (document.body.id === "results") {
      //on the results page
      //listener for clicking on the movie card container
    }
    if (document.body.id === "suggest") {
      //on the suggest page
      //listener for clicking on the movie card container
    }
    if (document.body.id === "fourohfour") {
      //on the 404 page
    }
  },
  changeOnlineStatus: (ev) => {
    //when the browser goes online or offline
  },
  messageReceived: (ev) => {
    //ev.data
  },
  sendMessage: (msg) => {
    //send a message to the service worker
  },
  searchFormSubmitted: (ev) => {
    ev.preventDefault();
    console.log("Working");
    //get the keyword from teh input
    APP.searchInput = document.getElementById("search").value;

    //make sure it is not empty
    if (APP.searchInput === "") {
      throw new Error("Please enter a search term.");
    } else {
      //check the db for matches
      let newTx = APP.createTransaction("searchStore");
      let searchStore = newTx.objectStore("searchStore");
      let getRequest = searchStore.get(APP.searchInput);

      getRequest.onsuccess = (ev) => {
        console.log(ev.target);

        if (ev.target.result === undefined) {
          //do a fetch call for search results
          console.log("Fetching from the API");
          APP.getData(APP.searchInput);
          console.log(APP.results)
          
        } else {
          console.log("Fetching from the DB!");
          console.log(ev.target.result);
          APP.getDBResults('searchStore', APP.searchInput)
        }
      };
    }
    //navigate to url
  },
  cardListClicked: (ev) => {
    // user clicked on a movie card
    //get the title and movie id
    //check the db for matches
    //do a fetch for the suggest results
    //save results to db
    //build a url
    //navigate to the suggest page
  },
  getData: (endpoint) => {
    //do a fetch call to the endpoint
    let url = `${APP.baseURL}search/movie?api_key=${APP.KEY}&query=${endpoint}`;
    fetch(url)
      .then((resp) => {
        if (resp.status >= 400) {
          throw new NetworkError(
            `Failed fetch to ${url}`,
            resp.status,
            resp.statusText
          );
        }
        return resp.json();
      })
      .then((contents) => {
        let results = contents.results;
        //remove the properties we don't need
        //save the updated results to APP.results
        APP.results = results
        console.log(APP.results)

        //save results to db
        APP.addResultsToDB(APP.results, 'searchStore')
      })
      .catch((err) => {
        //handle the NetworkError
        console.warn(err)
      });
  },
  getSearchResults: (keyword) => {
    //check if online
    //check in DB for match of keyword in searchStore
    //if no match in DB do a fetch
    // APP.displayCards is the callback
  },
  getSuggestedResults: (movieid) => {
    //check if online
    //check in DB for match of movieid in suggestStore
    //if no match in DB do a fetch
    // APP.displayCards is the callback
  },
  displayPreviousSearchList: () => {
    //show the list of previous search keywords as links to results page
  },
  displayCards: () => {
    
    //display all the movie cards based on the results array
    // in APP.results
    //these results could be from the database or from a fetch
  },
  navigate: (url) => {
    //change the current page
    window.location = url; //this should include the querystring
  },
};

document.addEventListener("DOMContentLoaded", APP.init);

class NetworkError extends Error {
  constructor(msg, status, statusText) {
    super(msg);
    this.status = status;
    this.statusText = statusText;
  }
}
