// API setup - your key to access movie database
const API_KEY = "e6392887";
const API_URL = "https://www.omdbapi.com/";

// Global variables - store data across functions
let watchlist = []; // Array to storee watchlist movies
let currentMovieDetails = {}; // Cache movie details to avoid re-fetching

// DOM elements - grab HTML elements to control them
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const statusMessage = document.getElementById("statusMessage");
const movieGrid = document.getElementById("movieGrid");
const watchlistGrid = document.getElementById("watchlistGrid");
const watchlistEmpty = document.getElementById("watchlistEmpty");
const themeToggle = document.getElementById("themeToggle");

// Initialize app - wait for page to load, then setup everything
document.addEventListener("DOMContentLoaded", function () {
  setupEventListeners(); // Set up click/keypress events
  updateWatchlistDisplay(); // Show empty watchlist initially
});

function setupEventListeners() {
  // Search functionality - button click and Enter key
  searchBtn.addEventListener("click", handleSearch);
  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      handleSearch(); // Run search when Enter pressed
    }
  });

  // Theme toggle - dark/light mode switch
  themeToggle.addEventListener("click", toggleTheme);

  // Live character counter - show typing progress
  searchInput.addEventListener("input", function () {
    const charCount = this.value.length;
    if (charCount > 0) {
      statusMessage.textContent = `Search term: ${charCount} chars`;
    } else {
      statusMessage.textContent = "";
    }
  });
}

async function handleSearch() {
  const searchTerm = searchInput.value.trim(); // Get search text, remove extra spaces

  // Validation - check if search box is empty
  if (!searchTerm) {
    statusMessage.textContent = "Please enter a movie title to search.";
    return;
  }

  // Check if API key is set
  if (API_KEY === "YOUR_API_KEY_HERE") {
    statusMessage.textContent = "Please add your OMDb API key to script.js";
    return;
  }

  // Show loading message and clear previous results
  statusMessage.textContent = "Searching...";
  movieGrid.innerHTML = "";

  try {
    // Fetch data from API - encodeURIComponent makes search term URL-safe
    const response = await fetch(
      `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}`,
    );
    const data = await response.json(); // Convert response to JavaScript object

    // Check if API returned results
    if (data.Response === "True") {
      displayMovies(data.Search); // Show the movies
      statusMessage.textContent = `Found ${data.Search.length} movies`;
    } else {
      // No results found
      statusMessage.textContent =
        data.Error || "No movies found. Try a different search term.";
      movieGrid.innerHTML =
        '<p style="text-align: center; color: #666;">No results found</p>';
    }
  } catch (error) {
    // Handle network errors
    console.error("Search error:", error);
    statusMessage.textContent =
      "Network error. Please check your connection and try again.";
  }
}

function displayMovies(movies) {
  movieGrid.innerHTML = ""; // Clear previous results

  // Loop through each movie and create a card
  movies.forEach((movie) => {
    const movieCard = createMovieCard(movie);
    movieGrid.appendChild(movieCard); // Add card to the grid
  });
}

function createMovieCard(movie, isWatchlist = false) {
  const card = document.createElement("div"); // Create new div element
  card.className = "movie-card fade-in"; // Add CSS classes

  // Use movie poster or placeholder if none available
  const posterUrl =
    movie.Poster !== "N/A"
      ? movie.Poster
      : "https://via.placeholder.com/300x450?text=No+Poster";

  // Create HTML content with template literal (${} inserts variables)
  card.innerHTML = `
        <img src="${posterUrl}" alt="${movie.Title}" class="movie-poster" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
        <div class="movie-info">
            <div class="movie-title">${movie.Title}</div>
            <div class="movie-year">${movie.Year} • ${movie.Type}</div>
            <div id="details-${movie.imdbID}" class="movie-details" style="display: none;"></div>
            ${
              isWatchlist
                ? `<button class="remove-from-watchlist" onclick="removeFromWatchlist('${movie.imdbID}')">Remove from Watchlist</button>`
                : `<button class="add-to-watchlist" onclick="addToWatchlist('${movie.imdbID}', '${movie.Title}', '${movie.Year}', '${posterUrl}', '${movie.Type}')">Add to Watchlist</button>`
            }
        </div>
    `;

  // Add click event for movie details (but not on buttons)
  card.addEventListener("click", function (e) {
    if (
      !e.target.classList.contains("add-to-watchlist") &&
      !e.target.classList.contains("remove-from-watchlist")
    ) {
      toggleMovieDetails(movie.imdbID); // Show/hide movie details
    }
  });

  return card; // Return the completed card
}

async function toggleMovieDetails(imdbID) {
  const detailsDiv = document.getElementById(`details-${imdbID}`);

  if (detailsDiv.style.display === "none") {
    // Details are hidden, so show them
    if (!currentMovieDetails[imdbID]) {
      // Don't have details yet, fetch from API
      try {
        const response = await fetch(
          `${API_URL}?apikey=${API_KEY}&i=${imdbID}`,
        );
        const movieData = await response.json();
        currentMovieDetails[imdbID] = movieData; // Cache the data
      } catch (error) {
        console.error("Error fetching movie details:", error);
        detailsDiv.innerHTML = "<p>Error loading details</p>";
        detailsDiv.style.display = "block";
        return;
      }
    }

    // Display the movie details
    const movie = currentMovieDetails[imdbID];
    detailsDiv.innerHTML = `
            <strong>Plot:</strong> ${movie.Plot !== "N/A" ? movie.Plot : "No plot available"}<br>
            <strong>Rating:</strong> ${movie.imdbRating !== "N/A" ? movie.imdbRating + "/10" : "No rating"}<br>
            <strong>Actors:</strong> ${movie.Actors !== "N/A" ? movie.Actors : "No actors listed"}
        `;
    detailsDiv.style.display = "block"; // Show the details
  } else {
    // Details are showing, so hide them
    detailsDiv.style.display = "none";
  }
}

function addToWatchlist(imdbID, title, year, poster, type) {
  // Check if movie is already in watchlist to prevent duplicates
  if (watchlist.find((movie) => movie.imdbID === imdbID)) {
    statusMessage.textContent = "Movie is already in your watchlist!";
    return;
  }

  // Create movie object with all needed info
  const movie = {
    imdbID: imdbID,
    Title: title,
    Year: year,
    Poster: poster,
    Type: type,
  };

  watchlist.push(movie); // Add to watchlist array
  updateWatchlistDisplay(); // Refresh the watchlist display
  statusMessage.textContent = `"${title}" added to watchlist!`;
}

function removeFromWatchlist(imdbID) {
  // Find movie position in watchlist array
  const movieIndex = watchlist.findIndex((movie) => movie.imdbID === imdbID);
  if (movieIndex > -1) {
    const removedMovie = watchlist.splice(movieIndex, 1)[0]; // Remove from array
    updateWatchlistDisplay(); // Refresh the display
    statusMessage.textContent = `"${removedMovie.Title}" removed from watchlist.`;
  }
}

function updateWatchlistDisplay() {
  watchlistGrid.innerHTML = ""; // Clear current watchlist display

  if (watchlist.length === 0) {
    // Show empty message if no movies in watchlist
  } else {
    // Hide empty message and show movies
    watchlistEmpty.style.display = "none";
    watchlist.forEach((movie) => {
      const movieCard = createMovieCard(movie, true); // true = this is for watchlist
      watchlistGrid.appendChild(movieCard);
    });
  }
}

function toggleTheme() {
  // Toggle dark-mode class on body (add if not there, remove if there)
  document.body.classList.toggle("dark-mode");

  // Update button text based on current theme
  if (document.body.classList.contains("dark-mode")) {
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
  }
}
