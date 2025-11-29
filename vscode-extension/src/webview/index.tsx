/**
 * Entry point for the MCP Guard webview
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Render the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}


