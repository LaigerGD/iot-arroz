import admin from "firebase-admin";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sistema-iot-c2ffd-default-rtdb.firebaseio.com"
});

const db = admin.database();

export default db;
