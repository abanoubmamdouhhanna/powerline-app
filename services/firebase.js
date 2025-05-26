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
//send notification
export const sendNotification = async (userId, title, body) => {
  const fcmToken = await getFCMToken(userId);
  if (!fcmToken) return;

  const message = {
    token: fcmToken,
    notification: {
      title,
      body,
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};
//====================================================================================================================//
