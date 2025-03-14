import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import QRCodeScannerPage from "./pages/scannerCard";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Verifica se o usuário está autenticado no localStorage
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true"); // Armazena o estado de autenticação
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated"); // Remove o estado de autenticação
  };

  return (
    <Routes>
      {!isAuthenticated ? (
        <Route path="/" element={<Login onLogin={handleLogin} />} />
      ) : (
        <>
          <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
          <Route path="/scanner/:cardId" element={<QRCodeScannerPage />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      )}
    </Routes>
  );
};

export default App;