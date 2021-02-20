const System = require('systemic');
const initController = require('./controller');

module.exports = new System({ name: 'controller' })
  .add('controller', initController())
  .dependsOn('config', 'logger', 'archiver');
