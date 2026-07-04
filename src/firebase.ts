import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBUVbe9YAS2qU01DcIiTVTfHJ6rQUzTluk",
  authDomain: "v2345-66433.firebaseapp.com",
  projectId: "v2345-66433",
  storageBucket: "v2345-66433.firebasestorage.app",
  messagingSenderId: "326140874923",
  appId: "1:326140874923:web:594fcda27b3486e682e7ee"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const docRef = doc(db, "websites", "homepage");
