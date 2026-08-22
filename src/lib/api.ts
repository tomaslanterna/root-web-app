import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://root-backend-service.onrender.com',
});

console.log("Axios baseURL configured as:", api.defaults.baseURL);
