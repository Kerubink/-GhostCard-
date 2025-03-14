import React, { useState } from "react";
import db from "../db/db"; // Importa a instância do banco de dados
import CryptoJS from "crypto-js";
import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";

// Funções de Criptografia
const encryptData = (data, key) => {
  return CryptoJS.AES.encrypt(data, key).toString(); // Criptografando os dados com a chave
};

const generateStrongPassword = () => {
  // Gerar uma senha forte aleatória
  return uuidv4().replace(/-/g, "").slice(0, 16); // Gerar uma senha de 16 caracteres
};

const AddCardForm = ({ closeModal, saveCard }) => {
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [passwordHash, setPasswordHash] = useState("");
  const [qrCode, setQrCode] = useState(null); // Estado para armazenar o QR Code
  const [uniqueId, setUniqueId] = useState(""); // Armazenar o UUID
  const [encryptionKey, setEncryptionKey] = useState(""); // Armazenar a chave de criptografia

  const handleGeneratePasswordAndQRCode = () => {
    const key = generateStrongPassword(); // Gerar uma chave forte
    const hashedKey = CryptoJS.SHA256(key).toString(); // Hash da chave para armazenamento seguro
    setPasswordHash(hashedKey);
    setEncryptionKey(key); // Armazenar a chave original no estado

    // Gerar um identificador único para o cartão
    const id = uuidv4();
    setUniqueId(id); // Armazenar o UUID no estado

    // Gerar o QR Code com a chave original
    QRCode.toDataURL(key, (err, url) => {
      if (err) console.error(err);
      setQrCode(url); // Armazenar o QR Code gerado no estado
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!encryptionKey) {
      alert("Primeiro, gere o QR Code.");
      return;
    }

    // Criptografar os dados do cartão usando a chave original
    const encryptedCardNumber = encryptData(cardNumber, encryptionKey);
    const encryptedExpiryDate = encryptData(expiryDate, encryptionKey);
    const encryptedCardholderName = encryptData(cardholderName, encryptionKey);

    const cardData = {
      id: uniqueId, // Usar o UUID único gerado
      encryptedCardNumber,
      encryptedExpiryDate,
      encryptedCardholderName,
      passwordHash, // Armazenar o hash da chave
    };

    try {
      // Salvar o cartão no IndexedDB usando Dexie
      await db.cards.put(cardData);

      // Fechar o modal
      closeModal();
      saveCard(cardData); // Passar os dados para o componente pai (opcional)
    } catch (error) {
      console.error("Erro ao salvar o cartão:", error);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-black text-white p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Cadastrar Novo Cartão</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm">Número do Cartão</label>
            <input
              type="text"
              className="w-full p-2 mt-1 rounded-lg bg-gray-800 text-white"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Digite o número do cartão"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm">Data de Expiração</label>
            <input
              type="text"
              className="w-full p-2 mt-1 rounded-lg bg-gray-800 text-white"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="MM/YY"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm">Nome no Cartão</label>
            <input
              type="text"
              className="w-full p-2 mt-1 rounded-lg bg-gray-800 text-white"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Nome do titular"
              required
            />
          </div>

          <button
            type="button"
            className="w-full bg-green-600 px-6 py-3 text-xl font-semibold rounded-lg shadow-lg hover:bg-green-500 transition duration-200 mb-4"
            onClick={handleGeneratePasswordAndQRCode}
          >
            Gerar Senha Segura e QR Code
          </button>

          {qrCode && (
            <div className="mb-4 text-center">
              <img src={qrCode} alt="QR Code" className="w-32 h-32 mx-auto" />
              <p className="text-sm mt-2">Este QR Code contém a chave para desbloquear o cartão.</p>
              <a
                href={qrCode}
                download="QRCode.png"
                className="text-sm text-blue-500 mt-2 block"
              >
                Clique para baixar o QR Code
              </a>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 px-6 py-3 text-xl font-semibold rounded-lg shadow-lg hover:bg-blue-500 transition duration-200"
            disabled={!passwordHash || !uniqueId}
          >
            Cadastrar Cartão
          </button>
        </form>

        <button
          className="w-full bg-red-600 px-6 py-2 mt-4 text-xl font-semibold rounded-lg shadow-lg hover:bg-red-500 transition duration-200"
          onClick={closeModal}
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

export default AddCardForm;