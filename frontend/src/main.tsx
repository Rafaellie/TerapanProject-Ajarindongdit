import React from 'react';
import { createRoot } from "react-dom/client";
import App from "./App.js";
import "./index.css";
import { AuthProvider } from './AuthContext.js'

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* Bungkus App dengan AuthProvider di sini */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
