import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "...",              // 换成 silerune-ee33e 的
  authDomain: "silerune-ee33e.firebaseapp.com",
  projectId: "silerune-ee33e",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const docRef = doc(db, "silerune", "data");
