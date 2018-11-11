import client from './client';
import server from './server';

export default (__BROWSER__ ? client : server);
