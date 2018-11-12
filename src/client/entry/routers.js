import NotFound from 'components/not-found';
import Loading from 'components/loading';
import Loadable from 'react-loadable';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Loadable({
      loader: () =>
        import(/* webpackChunkName: "detail" */ '../containers/home/detail'),
      loading: Loading,
      delay: 500
    }),
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: Loadable({
      loader: () =>
        import(/* webpackChunkName: "user" */ '../containers/home/user'),
      loading: Loading,
      delay: 500
    }),
    async asyncData(store, { params }) {
      await store.dispatch.news.loadUser(params.user_id);
    }
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Loadable({
      loader: () =>
        import(/* webpackChunkName: "feed" */ '../containers/home/feed'),
      loading: Loading,
      delay: 500
    }),
    async asyncData(store, { params }) {
      await store.dispatch.news.loadList(params.page);
    }
  },
  {
    name: '404',
    component: NotFound
  }
];
