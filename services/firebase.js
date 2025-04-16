// notifications.js
import admin from "firebase-admin";
import serviceAccount from "./firebaseKey.js";
import userTokenModel from "../DB/models/Firebase.model.js";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get a user's FCM token from DB
async function getFCMToken(userId) {
  const record = await userTokenModel.findOne({ userId });
  return record?.fcmToken || null;
}

//====================================================================================================================//
