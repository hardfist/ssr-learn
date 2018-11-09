import React from 'react';
import { Switch, Route, Link } from 'react-router-dom';
import RedirectWithStatus from '../../components/redirct-with-status';
import Routers from './routers';
import './index.scss';
export default class Home extends React.Component {
  render() {
    return (
      <div className="news-container">
        <div className="nav-container">
          <Link to={'/'}>Home</Link>
          <Link to={'/news/feed/1'}>Feed</Link>
          <Link to={'/news/detail/1'}>Detail</Link>
          <Link to={'/news/user/1'}>User</Link>
          <Link to={'/notfound'}>Not Found</Link>
        </div>
        <div className="stage-container">
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
      </div>
    );
  }
}
