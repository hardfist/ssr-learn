import { getItem, getTopStories, getUser } from 'shared/service/news';

export const news = {
  state: {
    detail: {
      item: {},
      comments: []
    },
    user: {},
    list: []
  },
  reducers: {
    updateUser(state, payload) {
      state.user = payload;
    },
    updateList(state, payload) {
      state.list = payload;
    },
    updateDetail(state, payload) {
      state.detail = payload;
    }
  },
  effects: dispatch => ({
    async loadUser(user_id) {
      const userInfo = await getUser(user_id);
      dispatch.news.updateUser(userInfo);
    },
    async loadList(page = 1) {
      const list = await getTopStories(page);
      dispatch.news.updateList(list);
    },
    async loadDetail(item_id) {
      const newsInfo = await getItem(item_id);
      const commentList = await Promise.all(
        newsInfo.kids.map(_id => getItem(_id))
      );
      dispatch.news.updateDetail({
        item: newsInfo,
        comments: commentList
      });
    }
  })
};
