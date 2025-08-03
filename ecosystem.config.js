module.exports = {
  apps: [
    {
      name: "abdullah460-server",
      script: "./dist/server.js",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
