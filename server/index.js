const app = require('./app');
const config = require('./utils/config');

const server = app.listen(config.port, () => {
  console.log(`Shop with Vikky API listening on port ${config.port}`);
});

function shutdown() {
  server.close(() => {
    require('./db').close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
