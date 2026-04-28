import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDesqpACAf9bosKpD1cNcN5VbJp_MbXiV4',
  authDomain: 'last-man-standing-51f6e.firebaseapp.com',
  databaseURL: 'https://last-man-standing-51f6e-default-rtdb.firebaseio.com',
  projectId: 'last-man-standing-51f6e',
  storageBucket: 'last-man-standing-51f6e.firebasestorage.app',
  messagingSenderId: '168038923018',
  appId: '1:168038923018:web:010798e715eb27274dd8f3',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
