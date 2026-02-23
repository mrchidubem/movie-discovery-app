import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_API_URL = import.meta.env.VITE_TMDB_API_URL;
const TMDB_IMAGE_URL = import.meta.env.VITE_TMDB_IMAGE_URL;

// Create axios instance for TMDB API
const tmdbApi = axios.create({
  baseURL: TMDB_API_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

// Common parameters for all requests
const defaultParams = {
  language: 'en-US',
  include_adult: false,
};

// Image URL builder
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null;
  return `${TMDB_IMAGE_URL}/${size}${path}`;
};

// API functions
export const getTrending = async (page = 1, cacheBust = false) => {
  try {
    const params = {
      ...defaultParams,
      page,
    };
    if (cacheBust) params._ = Date.now();

    const { data } = await tmdbApi.get('/trending/movie/week', {
      params,
    });
    return data;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    throw error;
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    const { data } = await tmdbApi.get('/search/movie', {
      params: {
        ...defaultParams,
        query,
        page,
      },
    });
    return data;
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

export const getMovieDetails = async (id) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${id}`, {
      params: {
        ...defaultParams,
        append_to_response: 'videos,credits,similar,reviews,keywords,images',
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

export const getMovieVideos = async (id) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${id}/videos`, {
      params: defaultParams,
    });
    return data.results;
  } catch (error) {
    console.error('Error fetching movie videos:', error);
    throw error;
  }
};

export const getMovieCredits = async (id) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${id}/credits`, {
      params: defaultParams,
    });
    return data;
  } catch (error) {
    console.error('Error fetching movie credits:', error);
    throw error;
  }
};

export const getSimilarMovies = async (id, page = 1) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${id}/similar`, {
      params: {
        ...defaultParams,
        page,
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching similar movies:', error);
    throw error;
  }
}; 

export const getNowPlaying = async (page = 1, cacheBust = false) => {
  try {
    const params = {
      ...defaultParams,
      page,
    };
    if (cacheBust) params._ = Date.now();

    const { data } = await tmdbApi.get('/movie/now_playing', {
      params,
    });
    return data;
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    throw error;
  }
};

export const getUpcoming = async (page = 1, cacheBust = false) => {
  try {
    const params = {
      ...defaultParams,
      page,
    };
    if (cacheBust) params._ = Date.now();

    const { data } = await tmdbApi.get('/movie/upcoming', {
      params,
    });
    return data;
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    throw error;
  }
};

// Get genres list
export const getGenres = async () => {
  try {
    const { data } = await tmdbApi.get('/genre/movie/list', {
      params: defaultParams,
    });
    return data.genres || [];
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};

// Get movies by genre (for category filtering)
export const getMoviesByGenre = async (genreName, page = 1, cacheBust = false) => {
  try {
    // First get genres list to find the ID
    const genres = await getGenres();
    const genre = genres.find((g) => g.name.toLowerCase() === genreName.toLowerCase());
    
    if (!genre) {
      console.error(`Genre "${genreName}" not found`);
      return { results: [], total_pages: 0 };
    }

    const params = {
      ...defaultParams,
      with_genres: genre.id,
      sort_by: 'popularity.desc',
      page,
    };
    if (cacheBust) params._ = Date.now();

    const { data } = await tmdbApi.get('/discover/movie', {
      params,
    });
    return data;
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
    throw error;
  }
};

// Get watch/providers for a movie (returns results object keyed by country)
export const getWatchProviders = async (id) => {
  try {
    const { data } = await tmdbApi.get(`/movie/${id}/watch/providers`, {
      params: defaultParams,
    });
    return data.results || {};
  } catch (error) {
    console.error('Error fetching watch providers:', error);
    throw error;
  }
};

// Generic discover endpoint wrapper for advanced filters
export const discoverMovies = async (options = {}, page = 1) => {
  try {
    const params = {
      ...defaultParams,
      page,
      ...options,
    };

    const { data } = await tmdbApi.get('/discover/movie', {
      params,
    });
    return data;
  } catch (error) {
    console.error('Error discovering movies:', error);
    throw error;
  }
};