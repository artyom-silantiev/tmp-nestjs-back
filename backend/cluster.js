/* eslint-disable @typescript-eslint/no-var-requires */

const _ = require('lodash');
const yargs = require('yargs');
const { apps } = require('./cluster.config.js');
const fs = require('fs-extra');
const path = require('path');
const prettier = require('prettier');

async function generatePm2Config() {
  const pm2Apps = [];

  for (const app of apps) {
    let baseName = app.name;

    if (app.exec_mode === 'cluster') {
      const instances = app.instances;

      for (let index = 0; index < instances; index++) {
        const pm2app = {
          name: `${baseName}_${index}`,
          script: app.script,
        };
        if (app.node_args) {
          pm2app.node_args = app.node_args;
        }
        if (app.env) {
          delete app.env.NODE_APP_INDEX;
          pm2app.env = {
            NODE_APP_INDEX: index,
            ...app.env,
          };
        }
        pm2Apps.push(pm2app);
      }
    } else {
      const pm2app = {
        name: baseName,
        script: app.script,
      };
      if (app.node_args) {
        pm2app.node_args = app.node_args;
      }
      if (app.env) {
        pm2app.env = app.env;
      }
      pm2Apps.push(pm2app);
    }
  }

  let pm2 = 'module.exports={';
  pm2 += 'apps: ' + JSON.stringify(pm2Apps, null, 2);
  pm2 += '};';
  pm2 = prettier.format(pm2, {
    singleQuote: true,
    parser: 'babel',
    format: 'js',
  });

  const pm2ConfigFile = path.resolve('./', 'pm2.config.js');
  await fs.writeFile(pm2ConfigFile, pm2);

  console.log('PM2 config generated:');
  console.log();
  console.log(pm2);
  console.log();
  console.log(pm2ConfigFile, 'created');
}

(async () => {
  const args = await yargs.parseAsync(process.argv);
  const cmdName = args._[2];

  if (cmdName === 'generate_pm2_config') {
    await generatePm2Config();
    process.exit();
  }
})();
