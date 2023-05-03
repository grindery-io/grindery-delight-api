import WebSocket from 'ws';
import { checkToken } from './src/utils/auth-utils.js';
import jwt_decode from 'jwt-decode';

function onConnection(ws, req) {
  ws.send(`Mercari Web Socket Server!`);

  const FIVE_SECONDS = 5000;
  const authTimeout = setTimeout(() => {
    ws.close();
    console.log('Client connection closed due to authentication timeout');
  }, FIVE_SECONDS);

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message);

      if (request.method !== 'authenticated') {
        ws.close();
        console.log('Client connection closed due to invalid method');
        return;
      }

      const accessToken = request.params.access_token;
      await checkToken(accessToken);
      const user = jwt_decode(accessToken);
      ws.userId = user.sub;

      clearTimeout(authTimeout);
      ws.send(JSON.stringify({ result: 'authenticated' }));
      console.log('Client authenticated');
    } catch (error) {
      console.error(error);
      const message = 'Client connection closed due to invalid token';
      ws.send(JSON.stringify({ result: message }));
      ws.close();
      console.log(message);
    }
  });
}

export default (server) => {
  let wss = new WebSocket.Server({
    server,
  });
  wss.on('connection', onConnection);
  console.log(`Mercari Web Socket Server is running!`);
  return wss;
};
