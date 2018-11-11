import { init } from '@rematch/core';
import immerPlugin from '@rematch/immer';
import { news } from './news';
const initPlugin = initialState => {
  return {
    config: {
      redux: {
        initialState
      }
    }
  };
};

export function createStore(initialState) {
  const store = init({
    models: { news },
    plugins: [immerPlugin(), initPlugin(initialState)]
  });
  return store;
}
