import moment from 'moment';

export function relativeTime(time) {
  return moment(new Date(time * 1000)).fromNow();
}

export function domain(url) {
  return url && url.split('/')[2];
}

export function delay(ms) {
  return new Promise(resolve => {
    return setTimeout(resolve, ms);
  });
}
export async function mockSuccess(delay_ms, result = {}) {
  await delay(delay_ms);
  return result;
}
export async function mockFail(delay_ms) {
  await delay(delay_ms);
  throw 'error'; //tslint:disable-line
}
