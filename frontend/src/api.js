import axios from 'axios';

// Create an 'instance' of axios with a base URL
const api = axios.create({
  baseURL: 'http://localhost:8000', // Your manager-api address
});

// This line is the most important part!
export default api;