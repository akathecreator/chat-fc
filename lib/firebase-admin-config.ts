import { AppOptions, cert, getApps, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const credentials: ServiceAccount = {
  projectId: process.env.FIREBASE_ADMIN_SDK_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_ADMIN_SDK_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  clientEmail: process.env.FIREBASE_ADMIN_SDK_CLIENT_EMAIL,
};

const options: AppOptions = {
  credential: cert(credentials),
};

export const initializeFirebaseAdmin = () => {
  const firebaseAdminApps = getApps();
  if (firebaseAdminApps.length > 0) {
    return firebaseAdminApps[0];
  }

  return initializeApp(options);
}

const firebaseAdmin = initializeFirebaseAdmin();

export const adminAuth = getAuth(firebaseAdmin);
export const adminFirestore = getFirestore(firebaseAdmin);
console.log('here')