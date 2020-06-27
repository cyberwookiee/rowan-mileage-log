import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import Settings from './components/Settings';
import './app.global.css';

render(
  <AppContainer>
    <Settings />
  </AppContainer>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./components/Settings', () => {
    // eslint-disable-next-line global-require
    const NextSettings = require('./components/Settings').default;
    render(
      <AppContainer>
        <NextSettings />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
