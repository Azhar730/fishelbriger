import { Server } from "http";
import app from "./app";
import config from "./config";

function main() {
  const server: Server = app.listen(Number(config.port), () => {
    console.log("Server is running on port", config.port);
  });

  // Socket server
  // setupWebSocket(server);

  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  process.on("uncaughtException", exitHandler);
  process.on("unhandledRejection", exitHandler);
}

// Start the server
main();
