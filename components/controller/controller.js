const path = require('path');

const { shouldRemove, asyncForEach } = require('../../util/util');

module.exports = () => {
  const start = async ({ config, logger, archiver }) => {
    const { localPath, opendataPath, deleteOffset } = config;

    const offset = Number(deleteOffset);

    const handleCompression = async filename => {
      try {
        logger.info(`File compression has started | Filename ${filename}`);

        const localFilePath = path.join(localPath, filename);
        await archiver.compressFile(localFilePath);

        logger.info(`File compression has been completed successfully | Filename ${filename}`);
      } catch (error) {
        logger.error(`Error compressing file | Filename ${filename} | Error ${error}`);
      }
    };

    const handleDeletion = async filename => {
      try {
        logger.info(`File deletion has started | Filename ${filename}`);

        const localFilePath = path.join(localPath, filename);
        const opendataFilePath = path.join(opendataPath, filename);

        const isFileToRemove = shouldRemove(filename, offset);
        const existsOpendata = archiver.checkFileExists(opendataFilePath);
        const existsZip = archiver.checkFileExists(`${localFilePath}.zip`);

        if (isFileToRemove && existsOpendata && existsZip) {
          await archiver.deleteFile(localFilePath);
          logger.info(`File has been deleted | Filename ${filename}`);
          return;
        }
        logger.info(`File does not fullfil requirements for deletion. Older ${isFileToRemove}, Opendata ${existsOpendata}, Zip ${existsZip} | Filename ${filename}`);
      } catch (error) {
        logger.error(`Error deleting file | Filename ${filename} | Error ${error}`);
      }
    };

    const handleBatchProcess = async () => {
      logger.info('Daily batch process has started');
      const files = await archiver.getDirectoryContent(localPath);

      const handleFile = async filename => {
        const opendataFilePath = path.join(opendataPath, filename);
        const compressedFile = path.join(localPath, `${filename}.zip`);

        const isFileToProcess = /^(19|20)\d\d([- /.])(0[1-9]|1[012])\2(0[1-9]|[12][0-9]|3[01])$/.test(filename);

        const alreadyCompressed = archiver.checkFileExists(compressedFile);
        const existsOpendata = archiver.checkFileExists(opendataFilePath);

        if (isFileToProcess && existsOpendata) {
          if (!alreadyCompressed) {
            await handleCompression(filename);
          } else {
            logger.info(`Skipping compression during batch process. File is already compressed | Filename ${filename}`);
          }
          await handleDeletion(filename);
        } else {
          logger.warn(`File does not fullfil requirements for batch process. File to process ${isFileToProcess}, Opendata ${existsOpendata} | Filename ${filename}`);
        }
      };
      await asyncForEach(files, handleFile);
    };

    return {
      handleCompression,
      handleDeletion,
      handleBatchProcess,
    };
  };

  return { start };
};
