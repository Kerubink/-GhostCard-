import React, { useEffect } from "react";
import QRCodeScanner from "../components/scanner";
import { useParams, useNavigate } from "react-router-dom";

const QRCodeScannerPage = () => {
  const { cardId } = useParams(); // Obtém o ID do cartão da URL
  const navigate = useNavigate(); // Para navegar de volta

  const handleCardUnlocked = (cardData) => {
    // Quando o cartão for desbloqueado, você pode redirecionar ou exibir os dados
    console.log("Cartão Desbloqueado:", cardData);
    navigate(-1); // Volta para a página anterior (CardList)
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <QRCodeScanner
        onScan={handleCardUnlocked}
        onClose={() => navigate(-1)} // Fecha o scanner e volta para a lista
      />
    </div>
  );
};

export default QRCodeScannerPage;
