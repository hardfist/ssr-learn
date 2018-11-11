import React from 'react';
import { Switch, Route } from 'react-router-dom';
import RedirectWithStatus from 'components/redirect-with-status';
import Routers from './routers';
import './index.scss';
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
            return <Route key={name} path={path} component={component} />;
          })}
        </Switch>
      </div>
    );
  }
}
