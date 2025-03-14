import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import db from "../db/db";
import { Lock } from "lucide-react";

const CardList = () => {
  const [cards, setCards] = useState([]);
  const [remainingTimes, setRemainingTimes] = useState({});
  const intervalsRef = useRef({});
  const navigate = useNavigate();
  const location = useLocation();

  // Carrega cartões do banco de dados
  useEffect(() => {
    const loadCards = async () => {
      const cards = await db.cards.toArray();
      setCards(cards);
    };
    loadCards();
  }, []);

  // Calcula tempo restante baseado no timestamp
  const getRemainingTime = (unlockTimestamp) => {
    const currentTime = Date.now();
    const elapsed = Math.floor((currentTime - unlockTimestamp) / 1000);
    return Math.max(60 - elapsed, 0);
  };

  // Limpa intervalos ao desmontar
  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(clearInterval);
    };
  }, []);

  // Atualiza o estado do tempo restante
  const updateRemainingTimeState = (cardId, time) => {
    setRemainingTimes(prev => ({
      ...prev,
      [cardId]: time
    }));
  };

  // Inicia/Atualiza timers
  useEffect(() => {
    const updateTimer = (cardId) => {
      const storedTime = sessionStorage.getItem(`unlock_${cardId}`);
      if (!storedTime) return;

      const unlockTimestamp = parseInt(storedTime, 10);
      
      const update = () => {
        const remaining = getRemainingTime(unlockTimestamp);
        
        if (remaining <= 0) {
          sessionStorage.removeItem(`card_${cardId}`);
          sessionStorage.removeItem(`unlock_${cardId}`);
          clearInterval(intervalsRef.current[cardId]);
          delete intervalsRef.current[cardId];
          updateRemainingTimeState(cardId, 0);
        } else {
          updateRemainingTimeState(cardId, remaining);
        }
      };

      // Atualização imediata
      update();

      // Configura intervalo de atualização
      intervalsRef.current[cardId] = setInterval(update, 1000);
    };

    // Processa novos dados do scanner
    if (location.state?.cardId) {
      updateTimer(location.state.cardId);
    }

    // Inicia timers para cartões existentes
    cards.forEach((card) => {
      if (sessionStorage.getItem(`card_${card.id}`)) {
        updateTimer(card.id);
      }
    });
  }, [cards, location.state]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-100">
        Meus Cartões Cadastrados
      </h1>
      <div className="grid gap-6">
        {cards.map((card) => {
          const storedData = sessionStorage.getItem(`card_${card.id}`);
          const storedTime = sessionStorage.getItem(`unlock_${card.id}`);
          const isUnlocked = !!storedData && !!storedTime;
          const remaining = remainingTimes[card.id] || 0;
          const cardData = isUnlocked ? JSON.parse(storedData) : null;

          return (
            <div 
              key={card.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3 flex-1">
                  <h2 className="text-xl font-semibold text-gray-300">
                    Cartão {isUnlocked ? card.id : `${card.id.slice(0, 6)}****`}
                  </h2>
                  
                  <div className="space-y-1">
                    <p className="text-gray-400">
                      Titular: {isUnlocked ? cardData.cardholderName : "#### ######"}
                    </p>
                    <p className="text-gray-400">
                      Válido até: {isUnlocked ? cardData.expiryDate : "##/##"}
                    </p>
                    <p className="text-gray-400">
                      Número: {isUnlocked ? cardData.cardNumber : "#### #### #### ####"}
                    </p>
                  </div>

                  {isUnlocked && remaining > 0 && (
                    <div className="mt-4">
                      <span className="inline-block bg-yellow-500/20 px-3 py-1 rounded-full text-sm text-yellow-400">
                        ⏳ Tempo restante: {remaining}s
                      </span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => navigate(`/scanner/${card.id}`)}
                  className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
                >
                  <Lock 
                    size={32} 
                    className={isUnlocked ? "text-green-400" : "text-red-400"}
                    strokeWidth={1.5}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CardList;