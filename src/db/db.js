import Dexie from "dexie";

const db = new Dexie("GhostCardDB");
db.version(1).stores({
  user: "pin", // Para armazenar o PIN do usuário
  cards: "id, encryptedCardNumber, encryptedExpiryDate, encryptedCardholderName, passwordHash", // Para armazenar os dados dos cartões
  biometricCredentials: "id, credential", // Nova tabela para credenciais biométricas
});

export default db;
