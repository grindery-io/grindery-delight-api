import { dispatchFirebase } from './firebase-utils.js';
import { dispatchWebSocket } from './websocket-utils.js';

export const sendNotification = (method, params, req) => {
  dispatchWebSocket(method, params);
  dispatchFirebase(method, params, req);
};
