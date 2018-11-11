import axios from 'axios';
const instance = axios.create();
instance.interceptors.response.use(
  response => {
    const data = response.data;
    return data;
  },
  err => {
    return Promise.reject(err);
  }
);
export default instance;
