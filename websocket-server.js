import WebSocket from 'ws';

function onConnection(ws, req) {
  ws.send(`Mercari Web Socket Server!`);
}

export default (server) => {
  let wss = new WebSocket.Server({
    server,
  });
  wss.on('connection', onConnection);
  console.log(`Mercari Web Socket Server is running!`);
  return wss;
};
