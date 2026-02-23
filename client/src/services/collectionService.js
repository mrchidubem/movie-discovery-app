import api from './api';

export const getCollections = async () => {
  try {
    const response = await api.get('/api/collections');
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

export const getCollection = async (collectionId) => {
  try {
    const response = await api.get(`/api/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw error;
  }
};

export const createCollection = async (collectionData) => {
  try {
    const response = await api.post('/api/collections', collectionData);
    return response.data;
  } catch (error) {
    console.error('Error creating collection:', error);
    throw error;
  }
};

export const updateCollection = async (collectionId, collectionData) => {
  try {
    const response = await api.put(`/api/collections/${collectionId}`, collectionData);
    return response.data;
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};

export const deleteCollection = async (collectionId) => {
  try {
    const response = await api.delete(`/api/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

export const addMovieToCollection = async (collectionId, movieData) => {
  try {
    const response = await api.post(`/api/collections/${collectionId}/movies`, {
      ...movieData,
      collectionId,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding movie to collection:', error);
    throw error;
  }
};

export const removeMovieFromCollection = async (collectionId, movieId) => {
  try {
    const response = await api.delete(`/api/collections/${collectionId}/movies/${movieId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing movie from collection:', error);
    throw error;
  }
};
