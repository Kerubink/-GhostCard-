import React, { useState } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from '../db/firebaseConfig'; 
import { doc, setDoc } from "firebase/firestore"; // Importando métodos para Firestore v9+

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [useBiometrics, setUseBiometrics] = useState(false);

  const handleRegister = async () => {
    const auth = getAuth();
    try {
      // Cria o usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Salva a preferência no Firestore
      await setDoc(doc(db, "users", user.uid), {
        useBiometrics, // Salvando a preferência de biometria
        createdAt: new Date(), // Você pode adicionar mais dados, se necessário
      });

      alert("Cadastro realizado com sucesso!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Digite seu e-mail"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Digite sua senha"
      />
      <label>
        <input
          type="checkbox"
          checked={useBiometrics}
          onChange={() => setUseBiometrics(!useBiometrics)}
        />
        Usar biometria
      </label>
      <button onClick={handleRegister}>Cadastrar</button>
    </div>
  );
};

export default Register;
