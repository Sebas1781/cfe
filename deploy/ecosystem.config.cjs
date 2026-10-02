module.exports = {
  apps: [
    {
      name: 'cfe-backend',
      script: 'server.js',
      cwd: __dirname + '/../server',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '700M',
      autorestart: true,
    },
  ],
};
