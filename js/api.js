// TMDB API 관련 모듈

const TMDB_API_KEY = "YOUR_TMDB_API_KEY"; // 🔑 실제 키 입력
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

/**
 * 장르 ID 배열로 영화 데이터 가져오기
 * @param {Array} genres - TMDB 장르 ID 배열
 * @returns {Promise<Array>} 영화 리스트
 */
async function fetchMoviesByGenres(genres) {
  const genreString = genres.join(",");
  const url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ko-KR&sort_by=popularity.desc&with_genres=${genreString}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("TMDB API 요청 실패");
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error("TMDB API 오류:", error);
    return [];
  }
}
