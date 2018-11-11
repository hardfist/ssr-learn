import App from './app';
import { Provider } from 'react-redux';
import { BrowserRouter, StaticRouter } from 'react-router-dom';
import Loadable from 'react-loadable';
import routes from './routers';
import ReactDOM from 'react-dom';
import React from 'react';
import { createStore } from './models';

const clientRender = async () => {
  const store = createStore(window.__INITIAL_STATE__);
  await Loadable.preloadReady();
  return ReactDOM.hydrate(
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>,
    document.getElementById('root')
  );
};

const serverRender = props => {
  return (
    <Provider store={props.store}>
      <StaticRouter location={props.url} context={props.context}>
        <App />
      </StaticRouter>
    </Provider>
  );
};

export default (__BROWSER__ ? clientRender() : serverRender);

export { serverRender as App, routes, createStore };
