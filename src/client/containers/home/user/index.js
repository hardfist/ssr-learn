import Layout from 'components/layout';
import * as Util from 'lib/util';
import React from 'react';
import { connect } from 'react-redux';
class User extends React.Component {
  render() {
    const { user } = this.props;
    return (
      <Layout>
        <div className="user-view view v-transition">
          <ul>
            <li>
              <span className="label">user:</span> {user.id}
            </li>
            <li>
              <span className="label">created:</span>{' '}
              {Util.relativeTime(user.created)}
            </li>
            <li>
              <span className="label">karma:</span> {user.karma}
            </li>
            <li>
              <span className="label">about:</span>
              <div
                className="about"
                dangerouslySetInnerHTML={{ __html: user.about }}
              />
            </li>
          </ul>
          <p className="links">
            <a href={`https://news.ycombinator.com/submitted?id=${user.id}`}>
              submissions
            </a>
            <br />
            <a href={`https://news.ycombinator.com/threads?id=${user.id}`}>
              comments
            </a>
          </p>
        </div>
      </Layout>
    );
  }
}
const mapState = state => {
  return {
    user: state.news.user
  };
};
const mapDispatch = dispatch => {
  return {
    loadUser: dispatch.news.loadUser
  };
};
export default connect(
  mapState,
  mapDispatch
)(User);
