import { create } from 'axios';

const api = create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export default api;
