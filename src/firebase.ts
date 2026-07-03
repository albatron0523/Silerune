import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyD52EMIKjauVO3Tlo71asmyWmIYiORpc0c",
  authDomain: "silerune-ee33e.firebaseapp.com",
  // 📢 已經修正為正確的台灣機房網址 (asia-east1)
  databaseURL: "https://silerune-ee33e-default-rtdb.asia-east1.firebasedatabase.app",
  projectId: "silerune-ee33e",
  storageBucket: "silerune-ee33e.firebasestorage.app",
  messagingSenderId: "1015874304350",
  appId: "1:1015874304350:web:f3664bca3fe9b7c92c37cf",
  measurementId: "G-195K1TEWXM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

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
