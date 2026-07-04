import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD52EMIKjauVO3Tlo71asmyWmIYiORpc0c",
  authDomain: "silerune-ee33e.firebaseapp.com",
  databaseURL: "https://silerune-ee33e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "silerune-ee33e",
  storageBucket: "silerune-ee33e.firebasestorage.app",
  messagingSenderId: "1015874304350",
  appId: "1:1015874304350:web:f3664bca3fe9b7c92c37cf",
  measurementId: "G-195K1TEWXM"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const docRef = doc(db, "silerune", "data");
