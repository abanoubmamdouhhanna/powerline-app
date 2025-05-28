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
// export const sendNotification = async (userId, title, body) => {
//   const fcmToken = await getFCMToken(userId);
//   console.log(fcmToken)
  
//   if (!fcmToken) return;

//   const message = {
//     token: fcmToken,
//     notification: {
//       title,
//       body,
//     },
//   };

//   try {
//     await admin.messaging().send(message);
//     console.log(`Notification sent to user ${userId}`);
//   } catch (error) {
//     console.error("Error sending notification:", error);
//   }
// };
export const sendNotification = async (userId, title, body, language = 'en') => {
  const fcmToken = await getFCMToken(userId);
  console.log('FCM Token:', fcmToken);

  if (!fcmToken) return;

  // Ensure title and body are objects with translations
  const resolvedTitle = typeof title === 'string' ? title : title?.[language] || title?.en || 'Default Title';
  const resolvedBody = typeof body === 'string' ? body : body?.[language] || body?.en || 'Default Body';

  const message = {
    token: fcmToken,
    notification: {
      title: resolvedTitle,
      body: resolvedBody,
    },
  };

  try {
    await admin.messaging().send(message);
    console.log(`Notification sent to user ${userId} in language ${language}`);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
};

//====================================================================================================================//
