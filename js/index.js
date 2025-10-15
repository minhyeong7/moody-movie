// === TMDB API 기본 설정 ===
const apiKey = "8cde0962eca9041f7345e9c7ab7a4b7f";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const DEFAULT_POSTER = "../assets/img/no-poster.png";

const moviesDiv = document.getElementById("movies");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const carousel = document.getElementById("carousel");

// === 인기 영화 가져오기 ===
async function getPopularMovies() {
  const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}&language=ko-KR&page=1`);
  const data = await res.json();
  renderCarousel(data.results.slice(0, 8)); // 캐러셀용 (상위 8개)
  renderGrid(data.results.slice(0, 12));   // 그리드용 (상위 12개)
}

// === 영화 검색 ===
async function searchMovies(query) {
  if (!query) return;
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`);
  const data = await res.json();
  renderGrid(data.results);
}

// === 캐러셀 렌더링 ===
function renderCarousel(movies) {
  carousel.innerHTML = "";
  if (!movies || movies.length === 0) {
    carousel.innerHTML = "<p>인기 영화가 없습니다.</p>";
    return;
  }

  const ring = document.createElement("div");
  ring.classList.add("ring");
  const N = movies.length;
  const radius = 420;

  movies.forEach((movie, i) => {
    const angle = (360 / N) * i;
    const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : DEFAULT_POSTER;

    const card = document.createElement("div");
    card.classList.add("poster");
    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}">
      <div class="meta">
        <div class="title">${movie.title}</div>
        <div class="sub">⭐ ${movie.vote_average?.toFixed(1) ?? "?"}</div>
      </div>
    `;

    // 클릭 시 상세 정보 보기
    card.addEventListener("click", () => openMovieModal(movie));
    ring.appendChild(card);
  });

  carousel.appendChild(ring);
}

// === 그리드 렌더링 ===
function renderGrid(movies) {
  moviesDiv.innerHTML = "";
  if (!movies || movies.length === 0) {
    moviesDiv.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  movies.forEach(movie => {
    const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : DEFAULT_POSTER;
    const card = document.createElement("div");
    card.classList.add("movie-card");
    card.innerHTML = `
      <img src="${poster}" alt="${movie.title}">
      <div class="info">
        <h3>${movie.title}</h3>
        <p>⭐ ${movie.vote_average?.toFixed(1) ?? "?"}</p>
        <p>${movie.release_date || "개봉일 정보 없음"}</p>
      </div>
    `;
    card.addEventListener("click", () => openMovieModal(movie));
    moviesDiv.appendChild(card);
  });
}

// === 상세 정보 모달 ===
function openMovieModal(movie) {
  const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : DEFAULT_POSTER;
  const modal = document.createElement("div");
  modal.classList.add("movie-modal");
  modal.innerHTML = `
    <div class="modal-content">
      <button class="close-btn">✖</button>
      <img src="${poster}" alt="${movie.title}">
      <div class="modal-info">
        <h2>${movie.title}</h2>
        <p><strong>평점:</strong> ${movie.vote_average?.toFixed(1) ?? "?"}</p>
        <p><strong>개봉일:</strong> ${movie.release_date || "정보 없음"}</p>
        <p><strong>줄거리:</strong><br>${movie.overview || "줄거리 정보가 없습니다."}</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector(".close-btn");
  closeBtn.addEventListener("click", () => modal.remove());

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.remove();
  });
}

// === 이벤트 ===
searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  searchMovies(query);
});

searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchMovies(searchInput.value.trim());
});

// === 초기 실행 ===
getPopularMovies();
