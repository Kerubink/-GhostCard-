import React, { useState, useEffect } from "react";
import db from "../db/db"; // Importando o banco de dados configurado com Dexie
import CryptoJS from "crypto-js";
import { Fingerprint, PencilLine, MoveRight } from "lucide-react";

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

// Função para validar o PIN e retornar erros específicos
const validatePin = (pin) => {
  const errors = [];

  if (pin.length < 8) {
    errors.push("O PIN deve ter no mínimo 8 caracteres.");
  }
  if (!/[A-Za-z]/.test(pin)) {
    errors.push("O PIN deve conter pelo menos uma letra.");
  }
  if (!/\d/.test(pin)) {
    errors.push("O PIN deve conter pelo menos um número.");
  }
  if (!/[@$!%*?&]/.test(pin)) {
    errors.push("O PIN deve conter pelo menos um caractere especial (@$!%*?&).");
  }

  return errors;
};

const Login = ({ onLogin }) => {
  const [pin, setPin] = useState("");
  const [isFirstAccess, setIsFirstAccess] = useState(null);
  const [hasBiometricCredential, setHasBiometricCredential] = useState(false);
  const [errors, setErrors] = useState([]); // Estado para erros de validação
  const [loginError, setLoginError] = useState(""); // Estado para erro de login (PIN incorreto)

  // Verifica suporte a WebAuthn
  const isWebAuthnSupported = window.PublicKeyCredential !== undefined;

  // Verifica se é o primeiro acesso e se há credenciais biométricas registradas
  useEffect(() => {
    const checkFirstAccessAndBiometric = async () => {
      const user = await db.user.toArray();
      setIsFirstAccess(user.length === 0);

      // Verifica se há credenciais biométricas registradas
      const biometricCredentials = await db.biometricCredentials.toArray();
      setHasBiometricCredential(biometricCredentials.length > 0);
    };
    checkFirstAccessAndBiometric();
  }, []);

  // Registra uma nova credencial biométrica
  const registerBiometric = async () => {
    try {
      const userId = new Uint8Array(16); // Gera um ID único para o usuário
      window.crypto.getRandomValues(userId);

      const publicKeyOptions = {
        challenge: new Uint8Array(32), // Desafio aleatório
        rp: { name: "https://ghost-card-sigma.vercel.app" }, // Nome do provedor
        user: {
          id: userId,
          name: "user@example.com", // Identificador do usuário
          displayName: "Usuário",
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          userVerification: "required", // Requer verificação do usuário
        },
        timeout: 120000, // Tempo limite de 120 segundos
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      // Extrai os dados serializáveis da credencial
      const serializableCredential = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)), // Converte ArrayBuffer para array
        type: credential.type,
        response: {
          clientDataJSON: Array.from(
            new Uint8Array(credential.response.clientDataJSON)
          ),
          attestationObject: Array.from(
            new Uint8Array(credential.response.attestationObject)
          ),
        },
      };

      // Salva a credencial biométrica no banco de dados
      await db.biometricCredentials.put({
        id: Array.from(userId), // Converte Uint8Array para array normal
        credential: serializableCredential,
      });

      console.log("Credencial biométrica registrada:", serializableCredential);
      alert("Biometria registrada com sucesso!");

      // Atualiza o estado para indicar que há uma credencial biométrica registrada
      setHasBiometricCredential(true);
    } catch (error) {
      console.error("Erro ao registrar biometria:", error);
      alert(
        "Falha ao registrar biometria. Verifique o console para mais detalhes."
      );
    }
  };

  // Autentica com biometria
  const authenticateBiometric = async () => {
    try {
      const credentials = await db.biometricCredentials.toArray();
      if (credentials.length === 0) {
        alert("Nenhuma credencial biométrica encontrada.");
        return;
      }

      const userId = new Uint8Array(credentials[0].id); // Recupera o ID do usuário

      // Converte os dados serializáveis de volta para o formato esperado pela API WebAuthn
      const credential = credentials[0].credential;
      const publicKeyCredential = {
        id: credential.id,
        rawId: new Uint8Array(credential.rawId).buffer, // Converte array para ArrayBuffer
        type: credential.type,
        response: {
          clientDataJSON: new Uint8Array(credential.response.clientDataJSON)
            .buffer,
          attestationObject: new Uint8Array(
            credential.response.attestationObject
          ).buffer,
        },
      };

      const publicKeyOptions = {
        challenge: new Uint8Array(32), // Desafio aleatório
        allowCredentials: [
          {
            id: publicKeyCredential.rawId,
            type: "public-key",
          },
        ],
        timeout: 120000, // Tempo limite de 120 segundos
        userVerification: "required", // Requer verificação do usuário
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });

      console.log("Autenticação biométrica bem-sucedida:", assertion);
      onLogin(); // Login bem-sucedido
    } catch (error) {
      console.error("Erro na autenticação biométrica:", error);
      alert(
        "Falha na autenticação biométrica. Verifique o console para mais detalhes."
      );
    }
  };

  // Login com PIN
  const handleLogin = async () => {
    // Limpa os erros anteriores
    setErrors([]);
    setLoginError("");

    if (isFirstAccess) {
      // Valida o PIN antes de cadastrar
      const validationErrors = validatePin(pin);
      if (validationErrors.length > 0) {
        setErrors(validationErrors); // Define os erros de validação
        return;
      }

      const encryptedPin = encryptPin(pin);
      await db.user.put({ pin: encryptedPin });
      alert("PIN cadastrado com sucesso!");
      setIsFirstAccess(false);
    } else {
      // Verifica se o PIN está correto
      const user = await db.user.toArray();
      if (user.length > 0 && decryptPin(user[0].pin) === pin) {
        onLogin();
      } else {
        setLoginError("PIN incorreto!"); // Define o erro de PIN incorreto
      }
    }
  };

  if (isFirstAccess === null) {
    return <p>Carregando...</p>;
  }

  return (
    <section className="bg-neutral-900 text-white h-screen flex flex-col items-center">
      <header className="flex flex-col items-center h-40 m-10">
        <img src="/logoWhite.png" alt="logo" className="h-30" />
        <h1 className="text-4xl font-black">
          Ghost<span className="text-blue-400">Card</span>
        </h1>
      </header>
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="flex-1 w-full flex gap-10 flex-col justify-center items-center">
          <div className="flex flex-col w-full items-center">
            <div className="flex flex-col w-[80%]">
              <label>{isFirstAccess ? "Crie um PIN" : "Digite seu PIN"}</label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrors([]); // Limpa os erros de validação ao digitar
                  setLoginError(""); // Limpa o erro de login ao digitar
                }}
                placeholder="PIN de 8 dígitos"
                className="text-white border-2 w-full border-white p-3 mt-2 rounded-xl"
              />
            </div>

            {/* Exibe os erros de validação */}
            {errors.length > 0 && (
              <div className=" text-red-500">
                {errors.map((error, index) => (
                  <p key={index}>{error}</p>
                ))}
              </div>
            )}

            {/* Exibe o erro de login (PIN incorreto) */}
            {loginError && <p className="mt-4 text-red-500">{loginError}</p>}
          </div>

          <button
            onClick={handleLogin}
            className=" bg-blue-500 text-white h-18 w-18 flex justify-center items-center rotate-45 relative rounded-xl hover:bg-blue-700"
          >
            {isFirstAccess ? (
              <div className="flex flex-col -rotate-45 items-center">
                <PencilLine size={30} />
              </div>
            ) : (
              <div className="flex flex-col -rotate-45 items-center">
                <MoveRight size={30} />
              </div>
            )}
          </button>
        </div>

        <div className="mt-auto mb-10">
          {isWebAuthnSupported && (
            <div className="mt-4">
              {!hasBiometricCredential && (
                <button
                  onClick={registerBiometric}
                  className="text-red-500 font-bold flex flex-col justify-center items-center gap-3 p-3 rounded hover:text-red-700"
                >
                  <Fingerprint size={40} />
                  Registrar
                </button>
              )}
              {hasBiometricCredential && (
                <button
                  onClick={authenticateBiometric}
                  className="font-bold flex text-green-500 flex-col justify-center items-center gap-3 p-3 rounded hover:text-green-700"
                >
                  <Fingerprint size={40} />
                  Entrar
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </section>
  );
};

export default Login;