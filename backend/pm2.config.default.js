module.exports = {
  apps: [
    {
      name: 'web',
      script: './dist/apps/web/main.js',
      node_args: '--enable-source-maps -r dotenv/config',
      exec_mode: 'cluster',
      instances: 1,
      increment_var: 'NODE_APP_INDEX',
      env: {
        NODE_APP_INDEX: 0,
        NODE_APP_TYPE: 'web',
        NODE_PORT: 3000,
      },
    },
  ],
};
