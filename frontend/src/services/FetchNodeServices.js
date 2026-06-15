import axios from 'axios';

const serverURL =
  import.meta.env.VITE_API_URL || 'http://localhost:7001';

// ✅ Axios instance
const api = axios.create({
  baseURL: serverURL,
  withCredentials: true, // for cookies (optional, keep it)
});

// ✅ REQUEST INTERCEPTOR (AUTO TOKEN ATTACH)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ❌ DO NOT manually set Content-Type
    // axios will handle JSON / FormData automatically

    return config;
  },
  (error) => Promise.reject(error),
);

// ✅ RESPONSE INTERCEPTOR (AUTO LOGOUT ON 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized — redirecting to login');

      localStorage.removeItem('token');

      window.location.href = '/login'; // adjust if needed
    }

    return Promise.reject(error);
  },
);

// ✅ ERROR HANDLER
const handleError = (error, method, url) => {
  const message =
    error.response?.data?.message || error.message || 'Something went wrong';

  const status = error.response?.status;

  console.error(
    `[${method}] /${url} => ${status || 'NETWORK ERROR'}: ${message}`,
  );

  return { success: false, message, status };
};

// ✅ POST
export const postData = async (url, body) => {
  try {
    const res = await api.post(`/${url}`, body);
    return res.data;
  } catch (error) {
    return handleError(error, 'POST', url);
  }
};

// ✅ GET
export const getData = async (url, params = {}) => {
  try {
    const res = await api.get(`/${url}`, { params });
    return res.data;
  } catch (error) {
    handleError(error, 'GET', url);
    throw error; // 🔥 IMPORTANT
  }
};

// ✅ PUT
export const putData = async (url, body) => {
  try {
    const res = await api.put(`/${url}`, body);
    return res.data;
  } catch (error) {
    return handleError(error, 'PUT', url);
  }
};

// ✅ PATCH
export const patchData = async (url, body) => {
  try {
    const res = await api.patch(`/${url}`, body);
    return res.data;
  } catch (error) {
    return handleError(error, 'PATCH', url);
  }
};

// ✅ DELETE
export const deleteData = async (url) => {
  try {
    const res = await api.delete(`/${url}`);
    return res.data;
  } catch (error) {
    return handleError(error, 'DELETE', url);
  }
};

export { serverURL, api };
