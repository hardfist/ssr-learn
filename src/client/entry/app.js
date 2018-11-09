import React from 'react';
import { Switch, Route } from 'react-router-dom';
import RedirectWithStatus from '../../components/redirct-with-status';
import Routers from './routers';
export default class Home extends React.Component {
  render() {
    return (
      <div className="news-container">
        <Switch>
          <RedirectWithStatus
            status={301}
            exact
            from={'/'}
            to={'/news/feed/1'}
          />
          {Routers.map(({ name, path, component }) => {
            return name === '404' ? (
              <Route key={name} component={component} />
            ) : (
              <Route key={name} path={path} component={component} />
            );
          })}
        </Switch>
      </div>
    );
  }
}
