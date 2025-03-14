import React, { useState, useEffect } from "react";
import db from "../db/db"; // Importa a instância do banco de dados
import CryptoJS from "crypto-js";

const encryptPin = (pin) => {
  const secretKey = import.meta.env.VITE_CRYPTO_SECRET_KEY;
  if (!secretKey) {
    console.error("Chave secreta não encontrada");
    return;
  }
  return CryptoJS.AES.encrypt(pin, secretKey).toString();
};

const decryptPin = (encryptedPin) => {
  const secretKey = import.meta.env.VITE_CRYPTO_SECRET_KEY;
  if (!secretKey) {
    console.error("Chave secreta não encontrada");
    return;
  }
  const bytes = CryptoJS.AES.decrypt(encryptedPin, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};

const Login = ({ onLogin }) => {
  const [pin, setPin] = useState("");
  const [isFirstAccess, setIsFirstAccess] = useState(null); // Começa como `null` para evitar falsos positivos

  // Função para verificar se é o primeiro acesso
  useEffect(() => {
    const checkFirstAccess = async () => {
      const user = await db.user.toArray(); // Pegamos os registros salvos
      setIsFirstAccess(user.length === 0); // Se não há PIN salvo, é o primeiro acesso
    };

    checkFirstAccess();
  }, []);

  const handleLogin = async () => {
    if (isFirstAccess) {
      const encryptedPin = encryptPin(pin);
      await db.user.put({ pin: encryptedPin });
      alert("PIN cadastrado com sucesso!");
      setIsFirstAccess(false); // Atualiza para login na próxima vez
    } else {
      const user = await db.user.toArray();
      if (user.length > 0 && decryptPin(user[0].pin) === pin) {
        onLogin(); // PIN correto, login bem-sucedido
      } else {
        alert("PIN incorreto!");
      }
    }
  };

  if (isFirstAccess === null) {
    return <p>Carregando...</p>; // Evita exibir informações incorretas antes da verificação
  }

  return (
    <div>
      <h1>{isFirstAccess ? "Crie um PIN" : "Digite seu PIN"}</h1>
      <input
        type="password"
        maxLength={8}
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN de 8 dígitos"
      />
      <button onClick={handleLogin}>
        {isFirstAccess ? "Criar PIN" : "Entrar"}
      </button>
    </div>
  );
};

export default Login;
