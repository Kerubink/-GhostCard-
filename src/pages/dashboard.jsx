import React, { useState } from "react";
import AddCardForm from "../components/cardForm";
import CardList from "../components/cardList";

const Dashboard = ({ onLogout }) => { // Recebe a função onLogout como prop
  const [cards, setCards] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const saveCard = (card) => {
    setCards([...cards, card]);
  };

  const openModal = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleAddCard = () => {
    alert("Cadastro de cartão será implementado!");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-gray-900 shadow-lg">
        <div className="flex items-center">
          <img src="logo.svg" alt="GhostCard Logo" className="h-10 w-10 mr-3" />
          <h1 className="text-3xl font-bold">GhostCard</h1>
        </div>
        <button
          className="bg-blue-600 px-6 py-2 text-xl font-semibold rounded-lg shadow-lg hover:bg-blue-500 transition duration-200"
          onClick={onLogout} // Chama a função onLogout ao clicar
        >
          Sair
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center p-6 max-w-lg w-full">
          <button
            className="bg-green-600 px-6 py-3 text-xl font-semibold rounded-lg shadow-lg hover:bg-green-500 transition duration-200 mb-6"
            onClick={openModal}
          >
            Cadastrar Cartão
          </button>

          {/* Lista de Cartões Cadastrados */}
          <div className="w-full flex-1">
            <h2 className="text-2xl font-semibold mb-4">Cartões Cadastrados</h2>
            <CardList />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-center p-4">
        <p className="text-sm">
          © 2025 GhostCard - Todos os direitos reservados.
        </p>
      </footer>

      {showModal && <AddCardForm closeModal={closeModal} saveCard={saveCard} />}
    </div>
  );
};

export default Dashboard;