import Dexie from "dexie";

const db = new Dexie("GhostCardDB");
db.version(2).stores({
  user: "pin",
  cards: "id, encryptedCardNumber, encryptedExpiryDate, encryptedCardholderName, passwordHash",
  biometricCredentials: "id, credential",
});

export default db;
