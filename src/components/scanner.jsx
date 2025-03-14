import React, { useRef, useState, useEffect } from "react";
import jsQR from "jsqr";
import CryptoJS from "crypto-js";
import db from "../db/db";
import { useNavigate, useParams } from "react-router-dom";

const Scanner = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const { cardId } = useParams();
  const navigate = useNavigate();

  // Função para descriptografar dados
  const decryptData = (encryptedData, key) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedData;
    } catch (error) {
      console.error("Erro ao decriptar dados:", error);
      return null;
    }
  };

  // Inicializa a câmera e escaneia o QR code
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Seu navegador não suporta acesso à câmera.");
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        } else {
          setError("Elemento de vídeo não encontrado.");
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          const scanQRCode = () => {
            if (videoRef.current) {
              const canvas = document.createElement("canvas");
              const context = canvas.getContext("2d");

              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;

              if (canvas.width === 0 || canvas.height === 0) {
                requestAnimationFrame(scanQRCode);
                return;
              }

              context.drawImage(
                videoRef.current,
                0,
                0,
                canvas.width,
                canvas.height
              );
              const imageData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const code = jsQR(imageData.data, canvas.width, canvas.height, {
                inversionAttempts: "dontInvert",
              });

              if (code && !isVerifying) {
                setIsVerifying(true);
                verifyQRCode(code.data);
              }
            }
            requestAnimationFrame(scanQRCode);
          };

          scanQRCode();
        };
      } catch (err) {
        setError("Erro ao acessar a câmera.");
        console.error("Erro ao acessar a câmera:", err);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isVerifying]);

  // Verifica o QR code escaneado
  const verifyQRCode = async (key) => {
    try {
      if (!cardId) {
        setError("ID do cartão inválido.");
        return;
      }

      const card = await db.cards.get(cardId);
      if (!card) {
        setError("Cartão não encontrado.");
        return;
      }

      const hashedKey = CryptoJS.SHA256(key).toString();

      if (hashedKey === card.passwordHash) {
        const decryptedCardNumber = decryptData(card.encryptedCardNumber, key);
        const decryptedExpiryDate = decryptData(card.encryptedExpiryDate, key);
        const decryptedCardholderName = decryptData(
          card.encryptedCardholderName,
          key
        );

        const decryptedData = {
          cardNumber: decryptedCardNumber,
          expiryDate: decryptedExpiryDate,
          cardholderName: decryptedCardholderName,
        };

        // Armazena na sessionStorage (dados temporários)
        // Salva APENAS no sessionStorage
        sessionStorage.setItem(
          `card_${card.id}`,
          JSON.stringify(decryptedData)
        );
        sessionStorage.setItem(`unlock_${card.id}`, Date.now()); // Timestamp atual

        navigate("/dashboard", { state: { cardId: card.id, decryptedData } });
      } else {
        setError("❌ Chave inválida. Tente novamente.");
        setTimeout(() => setError(null), 3000); // Limpa a mensagem após 3 segundos
      }
    } catch (error) {
      setError("Erro ao verificar o QR Code.");
      console.error("Erro ao verificar o QR Code:", error);
    } finally {
      setTimeout(() => setIsVerifying(false), 1500); // Permite uma nova tentativa rapidamente
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded">
          {error}
        </div>
      )}
      <video ref={videoRef} width="100%" height="auto" autoPlay muted></video>
    </div>
  );
};

export default Scanner;
