const path = require('node:path');

module.exports = {
  apps: [{
    name: 'filmvisarna',
    cwd: path.join(__dirname, 'Backend'),
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: { NODE_ENV: 'production' },
    kill_timeout: 12000,
    time: true,
  }],
};
