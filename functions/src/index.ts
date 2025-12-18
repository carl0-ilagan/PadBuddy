import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

// Placeholder for future cloud functions
// Add your cloud functions here

export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from PadBuddy Cloud Functions!");
});
