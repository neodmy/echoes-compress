const debug = require('debug')('service:compressor');
const path = require('path');

module.exports = () => {
  const start = async ({
    config, logger, archiver,
  }) => {
    debug('Initializing compressor controller');
    const { localPath } = config;

    const handleCompression = async filename => {
      try {
        logger.info(`File compression has started | Filename ${filename}`);

        const localFilePath = path.join(localPath, filename);
        await archiver.compressFile(localFilePath);
        await archiver.deleteFile(localFilePath);

        logger.info(`File compression has been completed successfully | Filename ${filename}`);
      } catch (error) {
        logger.error(`Error compressing file | Filename ${filename} | Error ${error}`);
        throw error;
      }
    };

    return {
      handleCompression,
    };
  };

  return { start };
};
