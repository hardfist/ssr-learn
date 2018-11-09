import App from './app';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import routes from './routers';
import ReactDOM from 'react-dom';
import React from 'react';

const clientRender = () => {
  return ReactDOM.hydrate(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
    document.getElementById('root')
  );
};

const serverRender = props => {
  return (
    <StaticRouter location={props.url} context={props.context}>
      <App />
    </StaticRouter>
  );
};

export default (__BROWSER__ ? clientRender() : serverRender);

export { serverRender as App, routes };
