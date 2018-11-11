import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, matchPath, withRouter } from 'react-router-dom';
import RedirectWithStatus from 'components/redirect-with-status';
import Routers from './routers';
import './index.scss';
class Home extends React.Component {
  componentDidMount() {
    const { history } = this.props; // 客户端的数据预取操作
    this.unlisten = history.listen(async location => {
      for (const route of Routers) {
        const match = matchPath(location.pathname, route);
        if (match) {
          await route.asyncData({ dispatch: this.props.dispatch }, match);
        }
      }
    });
  }
  componentWillUnmount() {
    this.unlisten();
  }
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
          <RedirectWithStatus
            status={301}
            exact
            from={'/news'}
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

const mapDispatch = dispatch => {
  return {
    dispatch
  };
};

export default withRouter(
  connect(
    undefined,
    mapDispatch
  )(Home)
);
