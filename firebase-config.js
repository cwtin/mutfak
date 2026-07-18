import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqOlZLi5WId4iuLkrLj5sPAhIFczBFNa4",
  authDomain: "mutfak-c9149.firebaseapp.com",

  // Realtime Database ekranındaki URL ile aynı olmalı.
  databaseURL:
    "https://mutfak-c9149-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "mutfak-c9149",
  storageBucket: "mutfak-c9149.firebasestorage.app",
  messagingSenderId: "395674235679",
  appId: "1:395674235679:web:d5f4b92968b7c05f3a762a",
  measurementId: "G-MEJ9SQVV1J"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);