import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './styles/main.css';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// Register the service worker for offline capabilities
serviceWorker.register();