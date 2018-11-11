import axios from 'axios';
const instance = axios.create();
instance.interceptors.response.use(
  response => {
    return response;
  },
  err => {
    return Promise.reject(err);
  }
);
export default instance;
