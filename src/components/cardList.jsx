import React, { useEffect, useState } from 'react';
import { db } from '../db/firebaseConfig'; // Certifique-se de importar a configuração correta
import { getDoc, doc } from "firebase/firestore"; // Para buscar um documento
import { getAuth } from 'firebase/auth'; // Para obter o ID do usuário autenticado

const CardList = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar os cartões do usuário
  const fetchUserCards = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser; // Obtém o usuário autenticado

      if (!user) {
        alert('Usuário não autenticado');
        return;
      }

      const userId = user.uid; // ID do usuário autenticado

      // Referência ao documento do usuário no Firestore
      const userDocRef = doc(db, "users", userId);

      // Obter o documento do usuário
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCards(userData.cards || []); // Armazena os cartões ou um array vazio caso não haja cartões
      } else {
        console.log('Documento do usuário não encontrado');
        setCards([]);
      }
    } catch (error) {
      console.error("Erro ao buscar os cartões: ", error);
    } finally {
      setLoading(false); // Finaliza o carregamento
    }
  };

  useEffect(() => {
    fetchUserCards(); // Carrega os cartões do usuário quando o componente é montado
  }, []);

  return (
    <div>
      <h1>Meus Cartões</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div>
          {cards.length === 0 ? (
            <p>Você ainda não adicionou nenhum cartão.</p>
          ) : (
            <ul>
              {cards.map((card, index) => (
                <li key={index}>
                  <p><strong>Id:</strong> {card.cardId}</p>
                  <p><strong>Nome do Titular:</strong> {card.cardHolder}</p>
                  <p><strong>Numero do cartão:</strong> {card.cardNumber}</p>
                  <p><strong>Data de Validade:</strong> {card.expirationDate}</p>
                  {/* Exibir outros dados do cartão conforme necessário */}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CardList;
