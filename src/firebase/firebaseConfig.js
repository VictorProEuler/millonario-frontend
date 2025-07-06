// src/firebase/firebaseConfig.js

import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBoxKivr3rZZNH4k0Om3iauOUoT5-0b_KQ",
  authDomain: "trivia-millonario.firebaseapp.com",
  projectId: "trivia-millonario",
  storageBucket: "trivia-millonario.firebasestorage.app",
  messagingSenderId: "938540070659",
  appId: "1:938540070659:web:d49780c04aaf15d23c5b36"
};

const app = initializeApp(firebaseConfig);

export default app;
