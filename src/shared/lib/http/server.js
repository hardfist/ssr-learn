import axios from 'axios';
import * as AxiosLogger from 'axios-logger';
const instance = axios.create();
instance.interceptors.request.use(AxiosLogger.requestLogger);
instance.interceptors.response.use(
  response => {
    AxiosLogger.responseLogger(response);
    return response;
  },
  err => {
    return Promise.reject(err);
  }
);
export default instance;
