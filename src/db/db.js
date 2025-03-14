import Dexie from "dexie";

// Configuração global do banco de dados
const db = new Dexie("GhostCardDB");

// Definindo as versões e stores (tabelas)
db.version(1).stores({
  user: "pin", // Para armazenar o PIN do usuário
  cards: "id, encryptedCardNumber, encryptedExpiryDate, encryptedCardholderName, passwordHash", // Para armazenar os dados dos cartões
});

export default db;
