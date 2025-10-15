// === TMDB API 기본 설정 ===
const apiKey = "8cde0962eca9041f7345e9c7ab7a4b7f";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const DEFAULT_POSTER = "../assets/img/no-poster.png";

// === 주요 DOM ===
const carousel = document.getElementById("carousel");
const genreBtns = document.querySelectorAll(".genre-btn");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const moviesDiv = document.getElementById("movies");
const backHomeBtn = document.getElementById("back-home");


// === 포스터 유틸 ===
function getPosterSrc(path) {
  return path ? IMAGE_BASE + path : DEFAULT_POSTER;
}
function createPosterImg(path, alt = "") {
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = alt || "포스터 이미지";
  img.src = getPosterSrc(path);
  img.onerror = () => (img.src = DEFAULT_POSTER);
  return img;
}

let currentRotation = 0;

// === 회전 추적 ===
function trackRotation() {
  const ring = document.querySelector(".ring");
  if (!ring) return;

  const transform = getComputedStyle(ring).transform;

  // matrix3d 또는 matrix 둘 다 대응
  if (transform && transform !== "none") {
    const matrix3d = transform.match(/matrix3d\((.+)\)/);
    const matrix2d = transform.match(/matrix\((.+)\)/);

    if (matrix3d) {
      const m = matrix3d[1].split(", ");
      const angle = Math.atan2(m[8], m[10]) * (180 / Math.PI);
      currentRotation = (angle + 360) % 360;
    } else if (matrix2d) {
      const m = matrix2d[1].split(", ");
      const angle = Math.atan2(m[1], m[0]) * (180 / Math.PI);
      currentRotation = (angle + 360) % 360;
    }
  }

  requestAnimationFrame(trackRotation);
}

function isCentered(angle) {
  const diff = Math.abs(((angle - currentRotation + 540) % 360) - 180);
  return diff < 10; // 중앙 ±10도만 허용
}

function pauseSpin() {
  const ring = document.querySelector(".ring");
  if (ring) ring.style.animationPlayState = "paused";
}

function resumeSpin() {
  const ring = document.querySelector(".ring");
  if (ring) ring.style.animationPlayState = "running";
}

function showHoverModal(movie) {
  let modal = document.querySelector(".movie-hover-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "movie-hover-modal";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <h2>${movie.title || "제목 없음"}</h2>
    <p><strong>평점:</strong> ${movie.vote_average?.toFixed?.(1) ?? "?"}</p>
    <p><strong>개봉일:</strong> ${movie.release_date || "정보 없음"}</p>
    <p>${movie.overview || "줄거리 정보가 없습니다."}</p>
  `;
  modal.style.display = "block";
}

function hideHoverModal() {
  const modal = document.querySelector(".movie-hover-modal");
  if (modal) modal.style.display = "none";
}

// === 캐러셀 렌더 ===
function renderCarousel(movies) {
  carousel.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.classList.add("ring-wrapper");

  const ring = document.createElement("div");
  ring.className = "ring";

  wrapper.appendChild(ring);
  carousel.appendChild(wrapper); 

  if (!movies || movies.length === 0) {
    carousel.innerHTML = "<p>영화 데이터를 불러오지 못했습니다.</p>";
    return;
  }

  const N = movies.length;
  const radius = 420;

  movies.forEach((movie, i) => {
    const angle = (360 / N) * i;
    const card = document.createElement("div");
    card.classList.add("poster");
    card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;

    const img = document.createElement("img");
    img.src = movie.poster_path
      ? `${IMAGE_BASE}${movie.poster_path}`
      : DEFAULT_POSTER;
    img.alt = movie.title;

    // Hover 이벤트
    card.addEventListener("mouseenter", () => {
      if (!isCentered(angle)) return; // 중앙 아닐 경우 무시
      pauseSpin();
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius + 80}px) scale(1.2)`;
      showHoverModal(movie);
    });

    card.addEventListener("mouseleave", () => {
      if (!isCentered(angle)) return;
      resumeSpin();
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
      hideHoverModal();
    });

    card.appendChild(img);
    ring.appendChild(card);
  });

}


// === 장르별 최신 영화 불러오기 ===
async function loadMoviesByGenre(genreIds) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&language=ko-KR&with_genres=${genreIds}&sort_by=release_date.desc&page=1`
    );
    const data = await res.json();
    renderCarousel(data.results.slice(0, 10));
  } catch (err) {
    console.error("장르별 영화 로드 실패:", err);
    carousel.innerHTML = "<p>영화를 불러오는 중 오류가 발생했습니다.</p>";
  }
}


// === 검색 ===
async function searchMovies(query) {
  if (!query) return;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&language=ko-KR&query=${encodeURIComponent(query)}&page=1`
    );
    const data = await res.json();
    renderGrid(data.results);
  } catch (err) {
    console.error("검색 오류:", err);
  }
}


// === 그리드 뷰 ===
function renderGrid(movies) {
  moviesDiv.innerHTML = "";
  if (!movies || movies.length === 0) {
    moviesDiv.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.classList.add("movie-card");

    const img = createPosterImg(movie.poster_path, movie.title || "");
    const info = document.createElement("div");
    info.className = "info";
    info.innerHTML = `
      <h3>${movie.title || "제목 없음"}</h3>
      <p>⭐ ${movie.vote_average?.toFixed?.(1) ?? "0.0"}</p>
      <p>${movie.release_date || "개봉일 정보 없음"}</p>
    `;

    card.append(img, info);
    moviesDiv.appendChild(card);
  });
}


// === 뷰 전환 ===
function showView(which) {
  const homeView = document.getElementById("home-view");
  const resultsView = document.getElementById("results-view");

  if (which === "results") {
    homeView.classList.add("hidden");
    resultsView.classList.remove("hidden");
  } else {
    resultsView.classList.add("hidden");
    homeView.classList.remove("hidden");
  }
}


// === 검색 실행 + URL 업데이트 ===
async function runSearch(query) {
  await searchMovies(query);
  showView("results");

  const url = new URL(window.location);
  url.searchParams.set("q", query);
  history.pushState({ q: query }, "", url);
}


// === 장르 버튼 클릭 이벤트 ===
genreBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    genreBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadMoviesByGenre(btn.dataset.id);
  });
});


// === 검색 이벤트 ===
if (searchBtn && searchInput) {
  searchBtn.addEventListener("click", () => {
    const q = searchInput.value.trim();
    if (q) runSearch(q);
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = searchInput.value.trim();
      if (q) runSearch(q);
    }
  });
}

backHomeBtn?.addEventListener("click", () => {
  showView("home");
  const url = new URL(window.location);
  url.searchParams.delete("q");
  history.pushState({}, "", url);
});


// === 초기 로드 ===
window.addEventListener("DOMContentLoaded", async () => {
  // URL 파라미터 확인
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  if (q) {
    searchInput.value = q;
    await runSearch(q);
  } else {
    // 기본 장르: 코미디
    await loadMoviesByGenre("35");
    showView("home");
  }
});
