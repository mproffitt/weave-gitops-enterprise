import React from 'react';
import { createRoot } from 'react-dom/client';
import AppContainer from './App';
import reportWebVitals from './reportWebVitals';

console.log('weave-gitops-enterprise ui:', process.env.REACT_APP_VERSION);

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);

reportWebVitals();
