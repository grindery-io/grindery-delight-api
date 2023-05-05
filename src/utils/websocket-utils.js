import { wss } from '../index.js';
import WebSocket from 'ws';

export const dispatch = (method, params) => {
  wss.clients.forEach(function each(client) {
    if (
      client.readyState === WebSocket.OPEN &&
      client.userId == params.userId
    ) {
      client.send(
        JSON.stringify({
          jsonrpc: '2.0',
          data: {
            method,
            params,
          },
        })
      );
    }
  });
};
