import axios from 'axios';

const BASE_URL = 'https://dummyjson.com/auth';

/**
 * Raw Auth API Service Functions
 * Separate from interceptors to avoid circular dependencies during refresh.
 */

export const loginApi = async (username, password) => {
    const response = await axios.post(`${BASE_URL}/login`, {
        username,
        password,
        expiresInMins: 30
    });
    return response.data;
};

export const refreshApi = async (refreshToken) => {
    const response = await axios.post(`${BASE_URL}/refresh`, {
        refreshToken,
        expiresInMins: 30
    });
    return response.data;
};
