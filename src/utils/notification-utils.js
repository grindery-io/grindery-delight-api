import { dispatchFirebase } from './firebase-utils.js';
import { dispatchWebSocket } from './websocket-utils.js';
import { wss } from '../index.js';

export const sendNotification = (method, params, req) => {
  let user;
  wss.clients.forEach(function (client) {
    user = client.userId === params.userId ? params.userId : undefined;
  });
  if (user) {
    dispatchWebSocket(method, params);
  } else {
    dispatchFirebase(method, params, req);
  }
};
