import firebase from 'firebase/compat/app';
import "firebase/compat/auth"
import "firebase/compat/firestore"
import "firebase/compat/storage"

const firebaseConfig = {
  apiKey: "AIzaSyB7s8_cdvzu_2TQbeJCr0adtXquQ_jDrkA",
  authDomain: "e-charge-planning.firebaseapp.com",
  projectId: "e-charge-planning",
  storageBucket: "e-charge-planning.appspot.com",
  messagingSenderId: "542424082740",
  appId: "1:542424082740:web:65dee00294c90767101d61",
  measurementId: "G-8MCQ279D7Y"
  };

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export { firebase };