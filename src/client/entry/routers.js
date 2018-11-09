import Detail from 'containers/home/detail';
import User from 'containers/home/user';
import Feed from 'containers/home/feed';
import NotFound from 'components/not-found';
export default [
  {
    name: 'detail',
    path: '/news/item/:item_id',
    component: Detail
  },
  {
    name: 'user',
    path: '/news/user/:user_id',
    component: User
  },
  {
    name: 'feed',
    path: '/news/feed/:page',
    component: Feed
  },
  {
    name: '404',
    component: NotFound
  }
];
