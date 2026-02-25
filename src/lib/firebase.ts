import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAPqtN1ZV6QnCdwg2Fy7rviiPAHrEhfhVg",
  authDomain: "salao2026.firebaseapp.com",
  databaseURL: "https://salao2026-default-rtdb.firebaseio.com",
  projectId: "salao2026",
  storageBucket: "salao2026.firebasestorage.app",
  messagingSenderId: "372649788538",
  appId: "1:372649788538:web:e3682a5710ad7f272ce7c3"
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

function getFirebaseApp() {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseDb() {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

export function getFirebaseAuth() {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

export { app, db, auth };
