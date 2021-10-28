import React from 'react';
import {render} from 'react-dom';
import App from './App';
import Store from './store/configureStore';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/es/integration/react';

render(
    <Provider store={Store.store}>
        <PersistGate loading={null} persistor={Store.persist}>
            <App/>
        </PersistGate>
    </Provider>,
    document.getElementById('root')
);
