import WebSocket from 'ws';
import { checkToken } from './src/utils/auth-utils.js';

function onConnection(ws, req) {
  ws.send(`Mercari Web Socket Server!`);

  const authTimeout = setTimeout(() => {
    ws.close();
    console.log('Client connection closed due to authentication timeout');
  }, 5000);

  ws.on('message', async (message) => {
    try {
      const request = JSON.parse(message);

      if (request.method !== 'authenticate') {
        ws.close();
        console.log('Client connection closed due to invalid method');
        return;
      }
      const accessToken = request.params.access_token;
      await checkToken(accessToken);

      clearTimeout(authTimeout);
      ws.send(JSON.stringify({ result: 'authenticated' }));
      console.log('Client authenticated');
    } catch (error) {
      console.error(error);
      ws.close();
      console.log('Client connection closed due to server error');
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
