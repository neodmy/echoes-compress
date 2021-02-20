const path = require('path');

module.exports = {
  logger: { transport: null },
  compressor: {
    localPath: path.join(__dirname, '../test/fixtures/temp/echoes'),
    allowDelete: 'active',
  },
  controller: {
    localPath: path.join(__dirname, '../test/fixtures/temp/echoes'),
    opendataPath: path.join(__dirname, '../test/fixtures/temp/opendata'),
    deleteOffset: 15,
  },
};
