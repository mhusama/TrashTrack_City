import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#ffffff",
              color: "#000000",
              border: "1px solid #6b0f1a",
            },
            success: { iconTheme: { primary: "#000000", secondary: "#ffffff" } },
            error: { iconTheme: { primary: "#000000", secondary: "#ffffff" } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
