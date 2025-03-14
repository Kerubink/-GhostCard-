import React, { useState, useEffect } from "react";
import { Route, Routes, Navigate, useNavigate } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import QRCodeScannerPage from "./pages/scannerCard";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });
  const navigate = useNavigate();

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem("isAuthenticated", "true");
    startInactivityTimer(); // Inicia o timer ao fazer login
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("isAuthenticated");
    navigate("/"); // Redireciona para a tela de login
  };

  // Função para iniciar o timer de inatividade
  const startInactivityTimer = () => {
    const inactivityTimeout = 1 * 60 * 1000; // 5 minutos em milissegundos

    let inactivityTimer = setTimeout(() => {
      handleLogout(); // Desloga o usuário após 5 minutos de inatividade
    }, inactivityTimeout);

    // Reinicia o timer ao detectar interação do usuário
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        handleLogout();
      }, inactivityTimeout);
    };

    // Eventos que reiniciam o timer
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Limpa os listeners ao desmontar o componente
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimeout(inactivityTimer);
    };
  };

  // Inicia o timer ao autenticar
  useEffect(() => {
    if (isAuthenticated) {
      startInactivityTimer();
    }
  }, [isAuthenticated]);

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