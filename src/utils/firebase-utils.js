import admin from 'firebase-admin';
import fcm from 'fcm-notification';
import { Database } from '../db/conn.js';

export const dispatchFirebase = async (method, params, req) => {
  const db = await Database.getInstance(req);
  const collection = db.collection('notification-tokens');

  const notificationToken = await collection.findOne({
    userId: params.userId,
  });

  if (notificationToken) {
    try {
      const message = {
        notification: {
          title: params.type + ' transaction confirmed',
          body: messageBuilder(method, params),
        },
        token: notificationToken.token,
      };

      firebase.send(message, function (err, resp) {
        if (err) {
          throw err;
        } else {
          console.log('Successfully sent notification');
        }
      });
    } catch (err) {
      console.log(
        'Error sending notification, token: ',
        notificationToken.token
      );
      console.log(err);
    }
  }
};

const firebaseCredentials = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X590_CERT_URL,
};

const firebase = new fcm(admin.credential.cert(firebaseCredentials));

const messageBuilder = (method, params) => {
  const id = params.id.slice(0, 6) + '...' + params.id.slice(-4);
  let status = 'placed';
  if (method == 'success') {
    status = 'created';
  }
  if (method == 'activationDeactivation') {
    status = 'activated/deactivated';
  }
  if (method == 'complete') {
    status = 'completed';
  }
  return `Your ${params.type} ${id} has been ${status}. Click to view in the Mercari dApp.`;
};
