import Detail from 'containers/home/detail';
import User from 'containers/home/user';
import Feed from 'containers/home/feed';
import NotFound from 'components/not-found';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Detail,
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: User,
    async asyncData(store, { params }) {
      await store.dispatch.news.loadUser(params.user_id);
    }
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Feed,
    async asyncData(store, { params }) {
      await store.dispatch.news.loadList(params.page);
    }
  },
  {
    name: '404',
    component: NotFound
  }
];
