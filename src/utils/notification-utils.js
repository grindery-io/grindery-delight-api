import { dispatchFirebase } from './firebase-utils.js';
import { dispatchWebSocket } from './websocket-utils.js';
import { wss } from '../index.js';

export const sendNotification = (method, params, req) => {
  if (
    Array.from(wss.clients).find((client) => client.userId === params.userId)
  ) {
    dispatchWebSocket(method, params);
  } else {
    dispatchFirebase(method, params, req);
  }
};
