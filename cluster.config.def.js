module.exports = {
  nodePath: '/home/artyom/.nvm/versions/node/v16.18.1/bin/node',
  apps: [
    {
      name: 'web',
      script: './dist/src/app_web/main.js',
      node_args: '--enable-source-maps -r dotenv/config',
      exec_mode: 'cluster',
      instances: 1,
      increment_var: 'NODE_APP_INDEX',
      env: {
        NO_COLOR: 1,
        NODE_APP_INDEX: 0,
        NODE_PORT: 3000,
      },
    },
  ],
};
