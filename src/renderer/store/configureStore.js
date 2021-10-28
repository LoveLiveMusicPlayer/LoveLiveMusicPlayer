'use strict';

import {applyMiddleware, createStore} from 'redux';
import {persistCombineReducers, persistStore} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';
import rootReducer from '../reducers/index';

const persistConfig = {
    key: 'root',
    storage: storage
};

const persistedReducer = persistCombineReducers(persistConfig, rootReducer);

let store = createStore(
    persistedReducer,
    applyMiddleware(thunk),
);
let persist = persistStore(store);

export default {store, persist};
