import NotFound from 'components/not-found';
import Loading from 'components/loading';
import Loadable from 'react-loadable';
import importAll from 'import-all.macro';
const component_glob = '../containers/home/?(detail|feed|user)';

const routes = importAll.deferred(component_glob);
for (const key of Object.keys(routes)) {
  if (typeof routes[key] === 'function') {
    routes[key] = Loadable({
      loading: Loading,
      loader: routes[key]
    });
  }
}
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: routes['../containers/home/detail'],
    async asyncData({ dispatch }, { params }) {
      await dispatch.news.loadDetail(params.item_id);
    }
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: routes['../containers/home/user'],
    async asyncData(store, { params }) {
      await store.dispatch.news.loadUser(params.user_id);
    }
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: routes['../containers/home/feed'],
    async asyncData(store, { params }) {
      await store.dispatch.news.loadList(params.page);
    }
  },
  {
    name: '404',
    component: NotFound
  }
];
