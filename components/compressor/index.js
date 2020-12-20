const System = require('systemic');
const initCompressor = require('./initCompressor');

module.exports = new System({ name: 'compressor' })
  .add('compressor', initCompressor())
  .dependsOn('config', 'logger', 'archiver');
