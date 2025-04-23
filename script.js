const API = {
  SHOWS: "https://api.tvmaze.com/shows",
  EPISODES: (showId) => `https://api.tvmaze.com/shows/${showId}/episodes`
};

const state = {
  shows: [],
  episodes: new Map(), // showId -> episodes[]
  currentShowId: null
};

window.onload = () => {
  initEventListeners();
  loadShows();
};

function initEventListeners() {
  document.getElementById("return-to-shows").addEventListener("click", (e) => {
    e.preventDefault();
    showShowsView();
    document.getElementById("global-search").value = "";
    hideStatus();
  });
  document.getElementById("global-search").addEventListener("input", handleGlobalSearch);
}

async function loadShows() {
  try {
    showLoading("Loading shows...");
    if (state.shows.length === 0) {
      const response = await fetch(API.SHOWS);
      if (!response.ok) throw new Error("Failed to load shows");
      state.shows = await response.json();
    }
    renderShows(state.shows);
    showShowsView();
    hideStatus();
  } catch (error) {
    showError(error.message);
  }
}

async function loadEpisodes(showId) {
  if (state.episodes.has(showId)) {
    renderEpisodes(state.episodes.get(showId));
    return;
  }
  try {
    showLoading("Loading episodes...");
    const response = await fetch(API.EPISODES(showId));
    if (!response.ok) throw new Error("Failed to load episodes");
    const episodes = await response.json();
    state.episodes.set(showId, episodes);
    renderEpisodes(episodes);
    hideStatus();
  } catch (error) {
    showError(error.message);
  }
}

function renderShows(shows) {
  const container = document.getElementById("shows-container");
  const template = document.getElementById("show-template");
  container.innerHTML = "";
  shows.forEach(show => {
    const card = template.content.cloneNode(true);
    card.querySelector(".show__title").textContent = show.name;
    card.querySelector(".show__image").src = show.image?.medium || "";
    card.querySelector(".show__image").alt = show.name;
    card.querySelector(".show__rating").textContent = `Rating: ${show.rating?.average ?? 'N/A'}`;
    card.querySelector(".show__runtime").textContent = show.runtime ? `${show.runtime} mins` : "";
    card.querySelector(".show__status").textContent = show.status;
    card.querySelector(".show__summary").innerHTML = show.summary || "";
    const genresContainer = card.querySelector(".show__genres");
    genresContainer.innerHTML = show.genres.map(genre => `<span>${genre}</span>`).join("");
    card.querySelector(".show-card").addEventListener("click", () => {
      state.currentShowId = show.id;
      document.getElementById("global-search").value = "";
      showEpisodesView();
      loadEpisodes(show.id);
      hideStatus();
    });
    container.appendChild(card);
  });
}

function renderEpisodes(episodes) {
  const container = document.getElementById("episodes-container");
  const template = document.getElementById("episode-template");
  container.innerHTML = "";
  episodes.forEach(ep => {
    const card = template.content.cloneNode(true);
    card.querySelector(".card__title").textContent = ep.name;
    card.querySelector(".card__code").textContent =
      `S${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(2, '0')}`;
    card.querySelector(".card__image").src = ep.image?.medium || "";
    card.querySelector(".card__image").alt = ep.name;
    card.querySelector(".card__summary").innerHTML = ep.summary || "";
    card.querySelector(".card__link").href = ep.url;
    container.appendChild(card);
  });
}

function showEpisodesView() {
  document.getElementById("shows-container").style.display = "none";
  document.getElementById("episodes-container").style.display = "flex";
  document.getElementById("return-to-shows").style.display = "inline";
}

function showShowsView() {
  document.getElementById("shows-container").style.display = "flex";
  document.getElementById("episodes-container").style.display = "none";
  document.getElementById("return-to-shows").style.display = "none";
  state.currentShowId = null;
}

function handleGlobalSearch(event) {
  const term = event.target.value.trim().toLowerCase();
  if (state.currentShowId) {
    // Search episodes
    const episodes = state.episodes.get(state.currentShowId) || [];
    const filtered = episodes.filter(ep =>
      (ep.name && ep.name.toLowerCase().includes(term)) ||
      (ep.summary && ep.summary.toLowerCase().includes(term))
    );
    renderEpisodes(filtered);
  } else {
    // Search shows
    const filtered = state.shows.filter(show =>
      (show.name && show.name.toLowerCase().includes(term)) ||
      (show.genres && show.genres.some(g => g.toLowerCase().includes(term))) ||
      (show.summary && show.summary.toLowerCase().includes(term))
    );
    renderShows(filtered);
  }
}

function showLoading(message) {
  document.getElementById("status-message").textContent = message;
  document.getElementById("loading-spinner").style.display = "inline";
}

function hideStatus() {
  document.getElementById("status-message").textContent = "";
  document.getElementById("loading-spinner").style.display = "none";
}

function showError(message) {
  document.getElementById("status-message").textContent = `Error: ${message}`;
}
