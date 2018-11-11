import Article from 'components/article';
import Layout from 'components/layout';
import React from 'react';
import { connect } from 'react-redux';
class Feed extends React.Component {
  render() {
    const { list } = this.props;
    return (
      <Layout>
        <div className="news-view view v-trnasition" />
        {list.map((item, idx) => (
          <Article key={idx} item={item} index={idx} />
        ))}
      </Layout>
    );
  }
}
const mapState = state => {
  return {
    list: state.news.list
  };
};
const mapDispatch = dispatch => {
  return {
    loadList: dispatch.news.loadList
  };
};

export default connect(
  mapState,
  mapDispatch
)(Feed);
