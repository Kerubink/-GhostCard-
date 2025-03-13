import React, { useState } from 'react';
import { db } from '../db/firebaseConfig'; // Certifique-se de importar a configuração correta
import CryptoJS from 'crypto-js'; // Para criptografia AES
import bcrypt from 'bcryptjs'; // Para o hash da senha
import { doc, setDoc, updateDoc } from "firebase/firestore"; // Para a versão 9+
import { getAuth } from 'firebase/auth'; // Para obter o ID do usuário autenticado

const CardForm = () => {
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  // Função para gerar um ID único para o cartão
  const generateCardId = () => {
    return `card_${new Date().getTime()}`; // Exemplo de ID único baseado no tempo
  };

  // Função para criptografar os dados
  const encryptCardData = (data) => {
    const secretKey = import.meta.env.VITE_CRYPTO_SECRET_KEY; // Usando import.meta.env para acessar variáveis de ambiente
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  };

  // Função para gerar a senha criptografada
  const generateEncryptedPassword = async () => {
    const password = generateCardId(); // Exemplo de senha aleatória para o QR Code
    const salt = bcrypt.genSaltSync(10); // Gerar salt para bcrypt
    const hashedPassword = await bcrypt.hash(password, salt);
    return { password, hashedPassword };
  };

  const handleAddCard = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser; // Obtém o usuário autenticado

      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      const userId = user.uid; // ID do usuário autenticado

      // Gerar um ID único para o cartão
      const cardId = generateCardId();

      // Criptografar os dados do cartão
      const encryptedCardNumber = encryptCardData(cardNumber);
      const encryptedExpirationDate = encryptCardData(expirationDate);
      const encryptedCardHolder = encryptCardData(cardHolder);

      // Gerar senha criptografada para o QR Code
      const { password, hashedPassword } = await generateEncryptedPassword();

      // Armazenar os dados no documento do usuário no Firestore
      const userDocRef = doc(db, "users", userId);

      // Verifique se o campo 'cards' já existe no documento do usuário, se não, crie-o
      await updateDoc(userDocRef, {
        cards: [
          ...(user.cards || []), // Adiciona os cartões existentes se houver
          {
            cardId,
            cardNumber: encryptedCardNumber,
            expirationDate: encryptedExpirationDate,
            cardHolder: encryptedCardHolder,
            password,
            hashedPassword
          }
        ]
      });

      alert('Cartão adicionado com sucesso!');
    } catch (error) {
      console.error("Erro ao adicionar o cartão: ", error);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={cardNumber}
        onChange={(e) => setCardNumber(e.target.value)}
        placeholder="Número do cartão"
      />
      <input
        type="text"
        value={expirationDate}
        onChange={(e) => setExpirationDate(e.target.value)}
        placeholder="Data de validade"
      />
      <input
        type="text"
        value={cardHolder}
        onChange={(e) => setCardHolder(e.target.value)}
        placeholder="Titular do cartão"
      />
      <button onClick={handleAddCard}>Adicionar Cartão</button>
    </div>
  );
};

export default CardForm;
