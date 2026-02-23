const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Advanced search with filters (year, rating, runtime, language, genre, country)
router.get('/', auth, async (req, res) => {
  try {
    const {
      q,
      genre,
      genres,
      category,
      country,
      minRating,
      maxRating,
      fromYear,
      toYear,
      minRuntime,
      maxRuntime,
      language,
      sortBy,
      page = 1,
    } = req.query;

    const TMDB_API_KEY = process.env.TMDB_API_KEY;
    const TMDB_API_URL = process.env.TMDB_API_URL || 'https://api.themoviedb.org/3';

    if (!TMDB_API_KEY) return res.status(500).json({ error: 'TMDB API key not configured' });

    // If a text query is provided, use TMDB search endpoint (supports region)
    if (q) {
      const params = {
        api_key: TMDB_API_KEY,
        query: q,
        page,
        language: language || 'en-US',
        include_adult: false,
      };
      if (country) params.region = country;

      const { data } = await axios.get(`${TMDB_API_URL}/search/movie`, { params });
      return res.json({ results: data.results || [], total_pages: data.total_pages || 0, page: data.page || 1, country: country || null });
    }

    // Otherwise use discover with filters
    const params = {
      api_key: TMDB_API_KEY,
      page,
      language: language || 'en-US',
      include_adult: false,
      sort_by: sortBy || 'popularity.desc',
    };

    if (minRating) params['vote_average.gte'] = minRating;
    if (maxRating) params['vote_average.lte'] = maxRating;
    if (fromYear) params['primary_release_date.gte'] = `${fromYear}-01-01`;
    if (toYear) params['primary_release_date.lte'] = `${toYear}-12-31`;
    if (minRuntime) params['with_runtime.gte'] = minRuntime;
    if (maxRuntime) params['with_runtime.lte'] = maxRuntime;

    // Accept either `genre` (single) or `genres` (comma separated)
    const genreParam = genre || genres || category;
    if (genreParam) {
      // If numeric ids provided, pass through. Otherwise attempt to map names to ids.
      const ids = [];
      const parts = String(genreParam).split(',').map(p => p.trim()).filter(Boolean);
      // Fetch genre list to map names
      const genresRes = await axios.get(`${TMDB_API_URL}/genre/movie/list`, { params: { api_key: TMDB_API_KEY, language: 'en-US' } });
      const allGenres = genresRes.data.genres || [];
      for (const p of parts) {
        if (/^\d+$/.test(p)) ids.push(p);
        else {
          const found = allGenres.find(g => g.name.toLowerCase() === p.toLowerCase());
          if (found) ids.push(String(found.id));
        }
      }
      if (ids.length) params.with_genres = ids.join(',');
    }

    // Country / region filtering for discover endpoint
    // Use both `region` (release date region) and `with_origin_country`
    if (country) {
      params.region = country;
      params.with_origin_country = country;
    }

    // Note: filtering by provider availability is heavy; clients can still fetch providers per movie.
    const { data } = await axios.get(`${TMDB_API_URL}/discover/movie`, { params });
    return res.json({ results: data.results || [], total_pages: data.total_pages || 0, page: data.page || 1, country: country || null });
  } catch (error) {
    console.error('Advanced search error', error?.response?.data || error.message || error);
    res.status(500).json({ error: error.message || 'Advanced search failed' });
  }
});

// Get hidden gems (high rated but less popular)
router.get('/hidden-gems', async (req, res) => {
  try {
    res.json({
      gems: [],
      message: 'High-rated but underrated movies',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
