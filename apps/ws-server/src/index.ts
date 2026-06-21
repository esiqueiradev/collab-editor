import { createServer } from "node:http";

const PORT = Number(process.env.PORT) || 4000;

const server = createServer((_req, res) => {
  res.writeHead(200);
  res.end("ws-server ok");
});

server.listen(PORT, () => {
  console.log(`ws-server listening on port ${PORT}`);
});
