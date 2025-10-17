/* ============================================================
 🧩 1. TMDB 기본 설정 및 주요 상수
============================================================ */
const apiKey = "8cde0962eca9041f7345e9c7ab7a4b7f";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const DEFAULT_POSTER = "../assets/img/no-poster.png";

/* ============================================================
 🧱 2. 주요 DOM 요소
============================================================ */
const genreBtns = document.querySelectorAll(".genre-btn");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const moviesDiv = document.getElementById("movies");
const slider = document.getElementById("slider");
const sliderTrack = document.getElementById("slider-track");

/* ============================================================
 🎞 3. 포스터 이미지 유틸 함수
============================================================ */
// ✅ 이미지 경로 생성
function getPosterSrc(path) {
  return path ? IMAGE_BASE + path : DEFAULT_POSTER;
}

// ✅ 포스터 이미지 엘리먼트 생성
function createPosterImg(path, alt = "") {
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = alt || "포스터 이미지";
  img.src = getPosterSrc(path);
  img.onerror = () => (img.src = DEFAULT_POSTER);
  return img;
}

// TMDB API로 불러온 영화 목록을 수평 슬라이드 형태로 표시
function renderSlider(movies) {
  sliderTrack.innerHTML = "";

  movies.forEach((movie) => {
    const card = document.createElement("div");
    card.classList.add("poster");
    card.dataset.id = movie.id;

    const img = createPosterImg(movie.poster_path, movie.title);
    const info = document.createElement("div");
    info.className = "info-overlay";
    info.innerHTML = `
      <h4>${movie.title}</h4>
      <p>⭐ ${movie.vote_average?.toFixed?.(1) ?? "0.0"} | 
      ${movie.release_date?.slice(0, 4) ?? "N/A"}</p>
    `;

    card.append(img, info);
    sliderTrack.appendChild(card);
  });

  applyHoverAndClickEffect(movies);
}

/* ============================================================
 🌐 TMDB 요청 유틸 함수
============================================================ */
async function fetchTMDB(endpoint, params = {}) {
  const baseUrl = "https://api.themoviedb.org/3/";
  const url = new URL(endpoint, baseUrl); 

  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "ko-KR");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB 요청 실패: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error("⚠️ TMDB 요청 실패:", err);
    return { results: [] }; // fallback
  }
}

/* ============================================================
 🖱️ 5. 슬라이더 hover + click 인터랙션 (중앙 정렬)
============================================================ */

function applyHoverAndClickEffect(movies) {
  const posters = document.querySelectorAll(".poster");
  const track = document.querySelector(".slider-track");
  let fixedPoster = null;

  // === dim-layer 생성 ===
  let dimLayer = document.querySelector(".dim-layer");
  if (!dimLayer) {
    dimLayer = document.createElement("div");
    dimLayer.className = "dim-layer hidden";
    document.body.appendChild(dimLayer);
  }

  // === detail box 생성 ===
  let detailBox = document.querySelector(".movie-detail");
  if (!detailBox) {
    detailBox = document.createElement("div");
    detailBox.className = "movie-detail hidden";
    document.body.appendChild(detailBox);
  }

  // === 닫기 공통 함수 ===
  const closeDetail = () => {
    if (!fixedPoster) return;

    // 🔸 detail fade-out
    detailBox.style.opacity = "0";
    detailBox.style.transform = "scale(0.95)";

    // 0.4초 뒤 실제 hidden 처리
    setTimeout(() => {
      detailBox.classList.add("hidden");
      dimLayer.classList.add("hidden");
      fixedPoster.classList.remove("active");
      fixedPoster.style.zIndex = "";
      fixedPoster.style.position = "";
      fixedPoster = null;
    }, 400);
  };

  // dim 클릭 시 닫기
  dimLayer.addEventListener("click", closeDetail);

  posters.forEach((poster) => {
    // === Hover 이동 ===
    poster.addEventListener("mouseenter", () => {
      if (fixedPoster) return;

      const style = window.getComputedStyle(track);
      const matrix = new DOMMatrixReadOnly(style.transform);
      const currentTranslateX = matrix.m41 || 0;

      const rect = poster.getBoundingClientRect();
      const posterCenter = rect.left + rect.width / 2;
      const windowCenter = window.innerWidth / 2;
      const moveDistance = posterCenter - windowCenter;
      const newTranslateX = currentTranslateX - moveDistance;

      track.style.transition = "transform var(--slider-transition)";
      track.style.transform = `translateX(${newTranslateX}px)`;
    });

    // === 클릭 시 디테일 열기 ===
    poster.addEventListener("click", async () => {
      // 이미 같은 포스터 클릭 → 닫기
      if (fixedPoster === poster) {
        closeDetail();
        return;
      }

      // 기존 상태 초기화
      posters.forEach(p => {
        p.classList.remove("active");
        p.style.zIndex = "";
        p.style.position = "";
      });

      // 🌑 dim-layer 활성화
      dimLayer.classList.remove("hidden");

      // 🌟 클릭 포스터 강조 (dim 위로 띄우기)
      poster.classList.add("active");
      poster.style.position = "relative";
      poster.style.zIndex = "9999";
      poster.closest(".slider").style.zIndex = "9998";
      fixedPoster = poster;

      // TMDB 상세 데이터 요청
      const movieId = poster.dataset.id;
      const data = await fetchTMDB(`movie/${movieId}`);

      detailBox.innerHTML = `
        <div class="detail-content">
          <h3>${data.title}</h3>
          <p>⭐ ${data.vote_average?.toFixed?.(1) ?? "0.0"} | ${data.release_date?.slice(0,4) ?? "N/A"}</p>
          <p>${data.overview || "줄거리 정보가 없습니다."}</p>
        </div>
      `;

      // detail box 위치 계산
      const rect = poster.getBoundingClientRect();
      detailBox.style.top = `${window.scrollY + rect.top + rect.height / 2 - detailBox.offsetHeight / 2}px`;
      detailBox.style.left = `${rect.right + 20}px`;
      detailBox.style.zIndex = "10000";

      // 초기 상태
      detailBox.style.opacity = "0";
      detailBox.style.transform = "scale(0.95)";
      detailBox.classList.remove("hidden");

      // 브라우저 리렌더 후 페이드 인
      void detailBox.offsetWidth;
      detailBox.style.opacity = "1";
      detailBox.style.transform = "scale(1)";
    });
  });
}


/* ============================================================
 🔍 6. 검색 및 장르별 로드 기능
============================================================ */

// === 장르별 인기 최신 영화 불러오기 (최근 1년 + 병렬 OR 방식) ===
async function loadMoviesByGenre(genreIds) {
  try {
    const ids = genreIds.split(","); // ["16", "10402"]처럼 나누기
    const today = new Date().toISOString().split("T")[0];
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 1);
    const fiveYearsAgoStr = fiveYearsAgo.toISOString().split("T")[0];

    // ✅ 공통 조건
    const fetches = ids.flatMap(id => [
    fetchTMDB("discover/movie", {
      sort_by: "popularity.desc",
      with_genres: id,
      "primary_release_date.gte": fiveYearsAgoStr,
      "primary_release_date.lte": today,
      vote_count: 50,
      page: 1
    }),
    fetchTMDB("discover/movie", {
      sort_by: "popularity.desc",
      with_genres: id,
      "primary_release_date.gte": fiveYearsAgoStr,
      "primary_release_date.lte": today,
      vote_count: 50,
      page: 2
    })
  ]);


    // ✅ 병렬로 전부 가져오기
    const results = await Promise.all(fetches);

    // ✅ 결과 통합 및 중복 제거
    let combined = results.flatMap(r => r.results || []);
    const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());

    if (!unique.length) {
      slider.innerHTML = "<p>해당 장르의 영화를 찾을 수 없습니다.</p>";
      return;
    }

    // ✅ 랜덤 섞기 + 상위 10개만 표시
    const shuffled = unique.sort(() => Math.random() - 0.5);
    renderSlider(shuffled.slice(0, 10));

  } catch (err) {
    console.error("🎬 장르별 영화 로드 실패:", err);
    slider.innerHTML = "<p>영화를 불러오는 중 오류가 발생했습니다.</p>";
  }
}


// 영화 검색
async function searchMovies(query) {
  if (!query) return;

  try {
    moviesDiv.innerHTML = "<p>🔍 검색 중입니다...</p>";

    const pages = [1, 2, 3];

    // ✅ fetchTMDB는 이미 json을 반환하므로 .then(res => res.json()) 필요 없음
    const fetches = pages.map(page =>
      fetchTMDB("search/movie", { query, page })
    );

    const results = await Promise.all(fetches);
    const merged = results.flatMap(r => r.results || []);

    // 중복 제거
    const unique = Array.from(new Map(merged.map(m => [m.id, m])).values());

    // ✅ 렌더링 호출
    renderGrid(unique);

    // ✅ 결과 반환 (선택)
    return unique;

  } catch (err) {
    console.error("검색 오류:", err);
    moviesDiv.innerHTML = "<p>❌ 검색 중 오류가 발생했습니다.</p>";
  }
}



/* ============================================================
 🧱 7. 검색 결과 그리드 뷰
============================================================ */
function renderGrid(movies) {
  moviesDiv.className = "grid";
  moviesDiv.innerHTML = "";
  if (!movies || movies.length === 0) {
    moviesDiv.innerHTML = "<p>검색 결과가 없습니다.</p>";
    return;
  }

  // ✅ dim-layer 1회만 생성
  let dimLayer = document.querySelector(".dim-layer");
  if (!dimLayer) {
    dimLayer = document.createElement("div");
    dimLayer.className = "dim-layer";
    document.body.appendChild(dimLayer);
  }

  let activeCard = null;

  const closeDetail = () => {
    if (!activeCard) return;
    activeCard.classList.remove("active");
    dimLayer.classList.remove("show");
    activeCard = null;
  };

  dimLayer.addEventListener("click", closeDetail);

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

    // ✅ detail-popup 박스
    const detailPopup = document.createElement("div");
    detailPopup.className = "detail-popup";

    card.append(img, info, detailPopup);
    moviesDiv.appendChild(card);

    card.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (activeCard === card) {
        closeDetail();
        return;
      }

      // 다른 카드 닫기
      if (activeCard) closeDetail();

      // TMDB 상세 데이터 불러오기
      const data = await fetchTMDB(`movie/${movie.id}`);

      detailPopup.innerHTML = `
        <h3>${data.title}</h3>
        <p>⭐ ${data.vote_average?.toFixed(1) ?? "0.0"} | ${data.release_date?.slice(0,4) ?? "N/A"}</p>
        <p>${data.overview || "줄거리 정보가 없습니다."}</p>
      `;

      card.classList.add("active");
      dimLayer.classList.add("show");
      activeCard = card;
    });
  });
}


// === TOP 버튼 기능 ===
const scrollTopBtn = document.getElementById("scrollTopBtn");
const resultsView = document.getElementById("results-view");

window.addEventListener("scroll", () => {
  const isResultsVisible = !resultsView.classList.contains("hidden");

  if (isResultsVisible && window.scrollY > 400) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  scrollTopBtn.classList.remove("show"); 
});



/* ============================================================
 🖥️ 8. 뷰 전환 (홈 ↔ 검색 결과)
============================================================ */
function showView(which) {
  const homeView = document.getElementById("home-view");
  const resultsView = document.getElementById("results-view");
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (which === "results") {
    homeView.classList.add("hidden");
    resultsView.classList.remove("hidden");

    // ✅ 탑버튼 상태 초기화
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  } else {
    resultsView.classList.add("hidden");
    homeView.classList.remove("hidden");
    scrollTopBtn.classList.remove("show"); // 홈에서는 항상 숨김
  }
}


/* ============================================================
 🔁 9. 검색 실행 + URL 업데이트
1️⃣ API 요청 → 인셉션 관련 영화 10개 불러옴  
2️⃣ 홈 화면 숨기고 결과 화면 표시  
3️⃣ 브라우저 주소 변경:
   http://localhost:3000/index.html?q=인셉션
4️⃣ 새로고침해도 "인셉션" 검색 결과 그대로 유지됨
============================================================ */
async function runSearch(query) {
  await searchMovies(query);
  showView("results");
  const url = new URL(window.location);
  url.searchParams.set("q", query);
  history.pushState({ q: query }, "", url);
}

/* ============================================================
 🎚️ 10. 이벤트 리스너 등록
============================================================ */

// === 장르 버튼 클릭 ===
genreBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    genreBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    loadMoviesByGenre(btn.dataset.id);
  });
});

// === 공통 검색 실행 함수 ===
async function handleSearch(inputEl) {
  const q = inputEl.value.trim();
  if (!q) return;

  // ✅ 화면 최상단으로 스크롤
  window.scrollTo({ top: 0, behavior: "smooth" });

  // ✅ “검색 중입니다...” 메시지 표시
  moviesDiv.innerHTML = "<p>🔍 검색 중입니다...</p>";

  // ✅ 검색 실행
  await runSearch(q);
}


// === 홈 검색창 ===
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

// === 🔍 검색 결과 페이지 검색창 ===
const searchInputResults = document.getElementById("search-input-results");
const searchBtnResults = document.getElementById("search-btn-results");

if (searchBtnResults && searchInputResults) {
  searchBtnResults.addEventListener("click", () => {
    const q = searchInputResults.value.trim();
    if (q) runSearch(q);
  });

  searchInputResults.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = searchInputResults.value.trim();
      if (q) runSearch(q);
    }
  });
}

/* ============================================================
 🚀 11. 초기 로드 + 로고 클릭 처리
============================================================ */
window.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");

  // ✅ 로고 클릭 시 홈으로 복귀
  const logo = document.querySelector(".logo-wrap");
  const scrollTopBtn = document.getElementById("scrollTopBtn");

  if (logo) {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      showView("home");
      const url = new URL(window.location);
      url.searchParams.delete("q");
      history.pushState({}, "", url);
      window.scrollTo({ top: 0, behavior: "smooth" });
      scrollTopBtn?.classList.remove("show");
    });
  }

  // ✅ 초기 로드
  if (q) {
    searchInput.value = q;
    await runSearch(q);
  } else {
    await loadMoviesByGenre("35");
    showView("home");
  }
});
