import React, { useState, useEffect } from "react";
import db from "../db/db";
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
  const [isFirstAccess, setIsFirstAccess] = useState(null);
  const [useBiometric, setUseBiometric] = useState(false);

  // Verifica suporte a WebAuthn
  const isWebAuthnSupported = window.PublicKeyCredential !== undefined;

  // Verifica se é o primeiro acesso
  useEffect(() => {
    const checkFirstAccess = async () => {
      const user = await db.user.toArray();
      setIsFirstAccess(user.length === 0);
    };
    checkFirstAccess();
  }, []);

  // Registra uma nova credencial biométrica
  const registerBiometric = async () => {
    try {
      const publicKeyOptions = {
        challenge: new Uint8Array(32), // Desafio aleatório
        rp: { name: "Secure Card Viewer" }, // Nome do provedor
        user: {
          id: new Uint8Array(16), // ID único do usuário
          name: "user@example.com", // Identificador do usuário
          displayName: "Usuário",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // Algoritmo ES256
        ],
        authenticatorSelection: {
          userVerification: "required", // Requer verificação do usuário
        },
        timeout: 60000, // Tempo limite de 60 segundos
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      console.log("Credencial biométrica registrada:", credential);
      alert("Biometria registrada com sucesso!");
    } catch (error) {
      console.error("Erro ao registrar biometria:", error);
      alert("Falha ao registrar biometria.");
    }
  };

  // Autentica com biometria
  const authenticateBiometric = async () => {
    try {
      const publicKeyOptions = {
        challenge: new Uint8Array(32), // Desafio aleatório
        timeout: 60000, // Tempo limite de 60 segundos
        userVerification: "required", // Requer verificação do usuário
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      console.log("Autenticação biométrica bem-sucedida:", assertion);
      onLogin(); // Login bem-sucedido
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      alert("Falha na autenticação biométrica.");
    }
  };

  // Login com PIN
  const handleLogin = async () => {
    if (isFirstAccess) {
      const encryptedPin = encryptPin(pin);
      await db.user.put({ pin: encryptedPin });
      alert("PIN cadastrado com sucesso!");
      setIsFirstAccess(false);
    } else {
      const user = await db.user.toArray();
      if (user.length > 0 && decryptPin(user[0].pin) === pin) {
        onLogin();
      } else {
        alert("PIN incorreto!");
      }
    }
  };

  if (isFirstAccess === null) {
    return <p>Carregando...</p>;
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

      {isWebAuthnSupported && (
        <div>
          <button onClick={registerBiometric}>Registrar Biometria</button>
          <button onClick={authenticateBiometric}>Entrar com Biometria</button>
        </div>
      )}
    </div>
  );
};

export default Login;