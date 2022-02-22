const APP = {
  DB: null, // The indexedDB
  isONLINE: "onLine" in navigator && navigator.onLine,
  KEY: "883762e0241bf7da58c9cb6546739dea",
  baseURL: "https://api.themoviedb.org/3/",
  imgURL: "http://image.tmdb.org/t/p/w500",
  results: [],
  movieID: "",
  searchInput: "",
  urlKeyword: "",
  recentSearch: "",

  init: () => {
    IDB.openDatabase();
  },

  addListeners: () => {
    // Add Event Listeners:

    // When the search form is submitted
    let search = document.getElementById("btnSearch");
    search.addEventListener("click", DATA.searchFormSubmitted);

    // When clicking on the list of possible searches on home or 404 page

    // When a message is received

    // When online and offline
    window.addEventListener("online", ONLINE.changeOnlineStatus);
    window.addEventListener("offline", ONLINE.changeOnlineStatus);
  },

  pageSpecific: (ev) => {
    // For anything that happens specifically on each page

    switch (document.body.id) {
      case "home":
        console.log("On home page.");
        IDB.checkDB("searchStore");
        break;
      case "results":
        // On the results page.
        console.log("On results page.");

        // Get search term from URL.
        let param = new URL(document.location).searchParams;
        APP.urlKeyword = param.get("keyword");
        DATA.getSearchResults(APP.urlKeyword);
        break;

      case "recommended":
        console.log("On suggest page.");
        //on the suggest page
        let movieParam = new URL(document.location).searchParams;
        APP.movieID = movieParam.get("movieid");

        DATA.getSuggestedResults(APP.movieID);
        //listener for clicking on the movie card container

        break;

      case "fourohfour":
        location.href = "/404.html";
        break;
    }
  },
};

const SW = {
  register: () => {
    console.log("Registering Service Worker");

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(function (error) {
        // Something went wrong during registration. The sw.js file
        // might be unavailable or contain a syntax error.
        console.warn(error);
      });
      navigator.serviceWorker.ready.then((registration) => {
        // .ready will never reject... just wait indefinitely
        registration.active;
        //save the reference to use later or use .ready again

        APP.addListeners();
        APP.pageSpecific();
      });
    }
  },
};

const IDB = {
  openDatabase: () => {
    let version = 2;
    //open the database
    let dbOpenRequest = indexedDB.open("pwaDB", version);
    //add the update, error, success listeners in here
    dbOpenRequest.onupgradeneeded = function (ev) {
      APP.DB = ev.target.result;

      try {
        APP.DB.deleteObjectStore("searchStore");
        APP.DB.deleteObjectStore("recommendStore");
      } catch {
        console.warn("Can't delete DB's, they might not exist yet!");
      }

      //create searchStore with keyword as keyPath
      APP.DB.createObjectStore("searchStore", {
        keyPath: "keyword",
        autoIncrement: false,
      });

      //create suggestStore with movieid as keyPath
      APP.DB.createObjectStore("recommendStore", {
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
      SW.register();
    };
  },

  addToDB: (obj, storeName) => {
    //pass in the name of the store

    let endpoint;
    let newObj;
    let add;

    let tx = IDB.createTransaction(storeName);
    let store = tx.objectStore(storeName);

    if (storeName === "recommendStore") {
      console.log("adding to rec store");
      endpoint = APP.movieID;
      newObj = {
        movieID: endpoint,
        results: obj,
      };
    } else {
      let param = new URL(document.location).searchParams;
      APP.urlKeyword = param.get("keyword");
      endpoint = APP.urlKeyword;

      newObj = {
        keyword: endpoint,
        results: obj,
      };
    }

    //save the obj passed in to the appropriate store
    add = store.add(newObj);

    console.log(add);
    add.onsuccess = (ev) => {
      console.log("Added movies to IDB!");
      console.log(ev);
      // DATA.getSearchResults(endpoint);
      BUILD.displayCards(APP.results);
    };
    add.onerror = (err) => {
      console.log(err);
      console.warn("Error adding movies to IDB!");
    };
  },

  getFromDB: (storeName, keyValue) => {
    // Return the results from storeName where it matches keyValue
    console.log("Checking data from IDB");

    let dbTx = IDB.createTransaction(storeName);
    let store = dbTx.objectStore(storeName);
    let dbResults = store.get(keyValue);

    dbResults.onsuccess = function (ev) {
      if (ev.target.result === undefined) {
        // Do a fetch call for search results
        console.log("Fetching from the API");
        DATA.fetchData(keyValue);
      } else {
        console.log("Fetching from the DB!");

        APP.results = ev.target.result.results;
        BUILD.displayCards(APP.results);
      }
    };
  },
  getRecentSearch: (storeName) => {
    let dbTx = IDB.createTransaction(storeName);
    let store = dbTx.objectStore(storeName);
    let dbResults = store.getAllKeys();

    dbResults.onsuccess = function (ev) {
      console.log("Getting search terms from DB!");
      // APP.recentSearch
      console.log(ev.target.result);
    };
  },

  createTransaction: (storeName) => {
    // Create a transaction to use for some interaction with the database
    let tx = APP.DB.transaction(storeName, "readwrite");
    return tx;
  },
};

const DATA = {
  fetchData: (endpoint) => {
    // Do a fetch call to the endpoint
    let url;

    let param = new URL(document.location).searchParams;

    if (param.get("keyword")) {
      url = `${APP.baseURL}search/movie?api_key=${APP.KEY}&query=${endpoint}`;
    } else {
      url = `${APP.baseURL}movie/${endpoint}/recommendations?api_key=${APP.KEY}&language=en-US&page=1`;
    }

    console.log(`Fetching data from ${url}`);

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
        console.log("Fetch results");
        // Remove the properties we don't need
        // Save the updated results to APP.results
        APP.results = contents.results;
        console.log(APP.results);

        // Add API response to IDB

        if (param.get("keyword")) {
          IDB.addToDB(APP.results, "searchStore");
        } else {
          IDB.addToDB(APP.results, "recommendStore");
        }
      })
      .catch((err) => {
        // Handle the Network Error
        console.warn(err);
        ONLINE.navigate("/404.html");
      });
  },

  searchFormSubmitted: (ev) => {
    console.log("Search from submitted.");
    ev.preventDefault();

    // Get the keyword from the input
    APP.searchInput = document.getElementById("search").value.toLowerCase();

    // Make sure the input is not empty

    if (APP.searchInput === "") {
      throw new Error("Please enter a search term!");
    } else {
      ONLINE.navigate(`/results.html?keyword=${APP.searchInput}`);
    }
  },

  getSearchResults: (keyword) => {
    console.log("getSearchResults");

    IDB.getFromDB("searchStore", keyword);
  },

  getSuggestedResults: (movieID) => {
    console.log("getSuggestedResults");

    IDB.getFromDB("recommendStore", movieID);
  },

  getMovieID: (ev) => {
    // Get movie ID
    let div = ev.target.closest(".card");
    APP.movieID = div.id;

    ONLINE.navigate(`/suggest.html?movieid=${APP.movieID}`);
  },
};

const ONLINE = {
  changeOnlineStatus: (ev) => {
    let onlineStatus = document.querySelector(".onlineStatus");
    //when the browser goes online or offline
    console.log(APP.isONLINE);
    switch (APP.isONLINE) {
      case true:
        console.log("Application is ONLINE.");
        onlineStatus.src = "/img/Online.svg";
      case false:
        console.log("Application is OFFLINE.");
        onlineStatus.src = "/img/Offline.svg";
    }
  },

  navigate: (url) => {
    console.log(`Navigating to ${url}`);
    location.href = url;
  },
};

const BUILD = {
  displayCards: (movies) => {
    console.log("Building Cards");

    let titleArea = document.querySelector(".titleArea");

    let title = document.createElement("h2");

    let param = new URL(document.location).searchParams;

    if (param.get("keyword")) {
      titleText =
        APP.urlKeyword.charAt(0).toUpperCase() + APP.urlKeyword.slice(1);
      title.textContent = `Search results for ${titleText}`;
    } else {
      title.textContent = `Movies similar to `;
    }

    titleArea.append(title);

    let contentArea = document.querySelector(".contentArea");

    let ol = document.createElement("ol");
    ol.classList.add("suggestMovieCards");

    let df = document.createDocumentFragment();

    movies.forEach((movie) => {
      let li = document.createElement("li");

      // Main card div
      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("style", "width: 18rem");
      card.setAttribute("id", movie.id);

      // Image
      let img = document.createElement("img");
      // Check if movie has poster or not, if not, set src as placeholder img.
      if (movie.poster_path === null) {
        img.src = "https://via.placeholder.com/500x750?text=IMAGE+NOT+FOUND";
        img.alt = "Movie poster not found.";
      } else {
        img.src = `${APP.imgURL}${movie.poster_path}`;
        img.alt = `${movie.original_title}'s movie poster.`;
      }

      // Card Body
      let cardBody = document.createElement("div");
      cardBody.classList.add("card-body");

      // Movie title
      let title = document.createElement("h2");
      title.textContent = `${movie.original_title}`;

      // Movie description
      let movieDesc = document.createElement("p");
      if (movie.overview === "") {
        movieDesc.textContent = "No Description Available :(";
      } else {
        movieDesc.textContent = `${movie.overview}`;
      }

      cardBody.append(title, movieDesc);
      card.append(img, cardBody);
      li.append(card);
      df.append(li);
    });
    ol.append(df);
    contentArea.append(ol);

    // Add Event Listener for clicking on the movie card container.
    mainCard = document.querySelector(".contentArea");
    mainCard.closest("div");
    mainCard.addEventListener("click", DATA.getMovieID);
  },
};

document.addEventListener("DOMContentLoaded", APP.init());
