const System = require('systemic');
const initTask = require('./initTask');

module.exports = new System({ name: 'task' })
  .add('task', initTask())
  .dependsOn('config', 'logger', 'compressor', 'cron');
