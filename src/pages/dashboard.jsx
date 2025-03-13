import React, { useEffect, useState } from "react";
import { db } from "../db/firebaseConfig"; // Firebase config
import { doc, getDoc } from "firebase/firestore";
import CardForm from "../components/cardForm";
import CardList from "../components/cardList";

const Dashboard = () => {


  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <CardForm/>
        <CardList/>
      </div>
    </div>
  );
};

export default Dashboard;
