import Article from 'components/article';
import Comment from 'components/comment';
import Layout from 'components/layout';
import React from 'react';
import { connect } from 'react-redux';

class Detail extends React.Component {
  render() {
    const { item, comments } = this.props;
    return (
      <Layout>
        <div className="item-view view v-transition">
          <Article item={item} />
          {comments.length > 0 && (
            <ul className="comments">
              {comments.map(comment => (
                <Comment key={comment.id} comment={comment} />
              ))}
            </ul>
          )}
          {comments.length === 0 && <p>No comments yet.</p>}
        </div>
      </Layout>
    );
  }
}
const mapState = state => {
  return {
    item: state.news.detail.item,
    comments: state.news.detail.comments
  };
};
const mapDispath = dispatch => {
  return {
    loadDetail: dispatch.news.loadDetail
  };
};
export default connect(
  mapState,
  mapDispath
)(Detail);
