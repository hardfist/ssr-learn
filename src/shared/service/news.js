import { serverUrl } from 'constants/url';
import http from 'shared/lib/http';
async function request(api, opts) {
  const result = await http.get(`${serverUrl}/${api}`, opts);
  return result.data;
}
async function getTopStories(page = 1, pageSize = 10) {
  let idList = [];
  try {
    idList = await request('topstories.json', {
      params: {
        page,
        pageSize
      }
    });
  } catch (err) {
    idList = [];
  }
  // parallel GET detail
  const newsList = await Promise.all(
    idList.slice(0, 10).map(id => {
      return request(`item/${id}.json`);
    })
  );
  return newsList;
}

async function getItem(id) {
  return await request(`item/${id}.json`);
}

async function getUser(id) {
  return await request(`user/${id}.json`);
}

export { getTopStories, getItem, getUser };
