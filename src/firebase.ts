import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database'; // 👈 已為您引入 Realtime Database 模組

export const firebaseConfig = {
  apiKey: "AIzaSyD52EMIKjauVO3Tlo71asmyWmIYiORpc0c",
  authDomain: "silerune-ee33e.firebaseapp.com",
  // 📢 已修正：您的 Realtime Database 實例是位於新加坡 (asia-southeast1)，而非台灣
  databaseURL: "https://silerune-ee33e-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "silerune-ee33e",
  storageBucket: "silerune-ee33e.firebasestorage.app",
  messagingSenderId: "1015874304350",
  appId: "1:1015874304350:web:f3664bca3fe9b7c92c37cf",
  measurementId: "G-195K1TEWXM"
};

const app = initializeApp(firebaseConfig);

// 匯出 Firestore (主要用於台灣機房的結構化資料讀寫，如您設定的 /silerune)
export const db = getFirestore(app);

// 匯出 Realtime Database (主要用於新加坡機房的即時資料，如 "新加坡新家大復活！")
export const rtdb = getDatabase(app); 

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
