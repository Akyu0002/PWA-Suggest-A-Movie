const APP = {
  DB: null, //the indexedDB
  isONLINE: "onLine" in navigator && navigator.onLine,
  KEY: "883762e0241bf7da58c9cb6546739dea",
  baseURL: "https://api.themoviedb.org/3/",
  imgURL: "",
  results: [],
  searchInput: "",

  init: () => {
    //when the page loads
    //open the database
    APP.openDatabase(APP.registerSW()); //register the service worker after the DB is open
  },

  registerSW: () => {
    //register the service worker
    navigator.serviceWorker.register("/sw.js").catch(function (err) {
      console.warn(err);
    });
    navigator.serviceWorker.ready.then((registration) => {
      APP.sw = registration.active;
    });
    //then add listeners and run page specific code
    APP.pageSpecific();
    APP.addListeners();
  },

  openDatabase: (nextStep) => {
    //open the database
    let version = 1;
    let dbOpenRequest = indexedDB.open("pwaDB", version);
    //add the update, error, success listeners in here
    dbOpenRequest.onupgradeneeded = function (ev) {
      DB = ev.target.result;

      try {
        DB.deleteObjectStore("searchStore");
        DB.deleteObjectStore("recommendStore");
      } catch (err) {
        console.log("error deleting old DB's!");
      }

      //create searchStore with keyword as keyPath
      let searchOptions = {
        keyPath: "keyword",
      };

      let suggestStore = DB.createObjectStore("searchStore", searchOptions);
      suggestStore.createIndex("by_title", "title", {unique:false})

      //create suggestStore with movieid as keyPath
      let recommendOptions = {
        keyPath: "movieid",
      };

      let recommendStore = DB.createObjectStore(
        "recommendStore",
        recommendOptions
      );

      recommendStore.createIndex("by_title", "title", {unique:false})
    };
    //call nextStep onsuccess
  },
  createTransaction: (storeName) => {
    let tx;
    //create a transaction to use for some interaction with the database
    tx = DB.transaction(storeName, "readwrite")
    return tx;
  },
  getDBResults: (storeName, keyValue) => {
    //return the results from storeName where it matches keyValue
  },
  addResultsToDB: (obj, storeName) => {
    console.log(obj)
    console.log(storeName)
    //pass in the name of the store
    let index = 0
    let store = tx.objectStore(storeName);
    let addRequest = store.add(obj[index]);

    //handle the successful completion of the add
    addRequest.onsuccess = (ev) => {
      index++;
      if (index < movies.length) {
        console.log("about to add movie", index);
        addMovies(tx, obj, index);
        //recursively call the addMovies method
        //inside the same transaction
      } else {
        //done adding all the MOVIES
      }
    };
    addRequest.onerror = (err) => {
      console.warn("Failed to add", err.message);
    };

    //save the obj passed in to the appropriate store
  },

  addListeners: () => {
    //add listeners
    //when the search form is submitted
    let search = document.getElementById("btnSearch");
    search.addEventListener("click", APP.searchFormSubmitted);
    //when clicking on the list of possible searches on home or 404 page
    //when a message is received
    //when online and offline
    window.addEventListener("online", APP.changeOnlineStatus);
    window.addEventListener("offline", APP.changeOnlineStatus);

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
    APP.isONLINE = ev.type === "online" ? true : false;

    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage({
        ONLINE: APP.isONLINE,
      });
    });
  },
  messageReceived: (ev) => {
    //ev.data
  },
  sendMessage: (msg) => {
    //send a message to the service worker
  },
  searchFormSubmitted: (ev) => {
    ev.preventDefault();

    //get the keyword from teh input
    APP.searchInput = document.getElementById('search').value
    console.log(APP.searchInput)
    // Make sure it is not empty

      APP.getData(APP.searchInput)

    //check the db for matches
    //do a fetch call for search results

    //save results to db


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
    console.log(`Fetching data for: ${endpoint}`)
    let url = `${APP.baseURL}search/movie?api_key=${APP.KEY}&query=${endpoint}`;
    console.log(url)
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
        //remove the properties we don't need
        let results = contents.results;
        //save the updated results to APP.results
        APP.results = results;
        APP.addResultsToDB(results, "searchStore")
        console.log(APP.results)
        // call the callback
        
      })
      .catch((err) => {
        //handle the NetworkError
        console.warn("NOT WORKING")
      });
  },
  getSearchResults: (keyword) => {
    //check if online
    if (APP.isONLINE == true) {

    } else {

    }
    //check in DB for match of keyword in searchStore
    //if no match in DB do a fetch
    // APP.displayCards is the callback
  },
  getSuggestedResults: () => {
    //check if online
    //check in DB for match of movieid in suggestStore
    //if no match in DB do a fetch
    // APP.displayCards is the callback
  },
  displayListOfSearches: () => {
    // Show the list of previous search terms.
    // Data inside of APP.results
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
