const System = require('systemic');
const initCron = require('./initCron');

module.exports = new System({ name: 'cron' })
  .add('cron', initCron())
  .dependsOn('config', 'logger', 'compressor');
