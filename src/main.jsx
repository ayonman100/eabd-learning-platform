import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LearnerProvider } from "./context/LearnerContext.jsx";
import "./index.css";
import "./styles/accessibility.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <LearnerProvider>
          <App />
        </LearnerProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
