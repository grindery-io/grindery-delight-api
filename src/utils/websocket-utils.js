import { wss } from '../index.js';
import WebSocket from 'ws';

export const dispatch = (data) => {
  wss.clients.forEach(function each(client) {
    if (
      client.readyState === WebSocket.OPEN &&
      client.userId == data.params.userId
    ) {
      client.send(
        JSON.stringify({
          jsonrpc: '2.0',
          data,
          id: data.params.id,
        })
      );
    }
  });
};
