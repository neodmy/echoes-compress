const System = require('systemic');
const { join } = require('path');

module.exports = () => new System({ name: 'echoes-compress' })
  .bootstrap(join(__dirname, 'components'));
