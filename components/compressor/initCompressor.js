const debug = require('debug')('service:compressor');
const path = require('path');

const { asyncForEach } = require('../../util/util');

module.exports = () => {
  const start = async ({
    config, logger, archiver,
  }) => {
    debug('Initializing compressor controller');
    const { localPath, allowDelete } = config;

    const handleCompression = async filename => {
      try {
        logger.info(`File compression has started | Filename ${filename}`);

        const localFilePath = path.join(localPath, filename);
        await archiver.compressFile(localFilePath);

        if (allowDelete === 'active') {
          await archiver.deleteFile(localFilePath);
        }

        logger.info(`File compression has been completed successfully | Filename ${filename}`);
      } catch (error) {
        logger.error(`Error compressing file | Filename ${filename} | Error ${error}`);
      }
    };

    const handleInitialCompression = async () => {
      logger.info('Initial compression for all the files');
      try {
        const files = await archiver.getDirectoryContent(localPath);

        const handleFile = async filename => {
          const isFileToProcess = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/.test(filename);
          if (isFileToProcess) await handleCompression(filename);
        };

        await asyncForEach(files, handleFile);
      } catch (error) {
        logger.error(`Error during initial compression | Error ${error}`);
      }
    };

    return {
      handleCompression,
      handleInitialCompression,
    };
  };

  return { start };
};
