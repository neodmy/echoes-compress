const path = require('path');

module.exports = {
  logger: { transport: null },
  compressor: {
    localPath: path.join(__dirname, '../test/fixtures/temp/echoes'),
    allowDelete: 'active',
  },
};
