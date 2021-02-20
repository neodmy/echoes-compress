const path = require('path');
const fs = require('fs-extra');

const system = require('../../../system');

const {
  controller: { localPath, opendataPath, deleteOffset },
} = require('../../../config/test');

describe('Controller component tests', () => {
  let sys = system();
  let controller;
  let archiver;

  let compressFileSpy;
  let deleteFileSpy;

  beforeAll(async () => {
    sys = sys.remove('cron');
    ({ controller, archiver } = await sys.start());
    compressFileSpy = jest.spyOn(archiver, 'compressFile');
    deleteFileSpy = jest.spyOn(archiver, 'deleteFile');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  const generateFile = (shouldBeRemoved = false) => {
    const today = new Date();
    const offset = shouldBeRemoved ? deleteOffset + 1 : 0;
    today.setDate(today.getDate() - offset);
    return today.toISOString().split('T')[0];
  };

  describe('handleCompression', () => {
    test('should handle an error silently when the file to compress does not exist', async () => {
      const filename = 'not_a_file';

      let err;
      try {
        await controller.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).toHaveBeenCalledWith(path.join(localPath, filename));
      }
    });

    test('should compress the file', async () => {
      const filename = generateFile(true);
      const originalBackup = `${localPath}/${filename}`;
      fs.ensureDirSync(originalBackup);

      let err;
      try {
        await controller.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).toHaveBeenCalledWith(path.join(localPath, filename));

        fs.removeSync(originalBackup);
        fs.removeSync(`${originalBackup}.zip`);
      }
    });
  });

  describe('handleDeletion', () => {
    test('should skip the deletion when the file is not older than the offset', async () => {
      const filename = generateFile(false);

      let err;
      try {
        await controller.handleDeletion(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(deleteFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should skip the deletion when the file is older than the offset but the opendata folder does not exist', async () => {
      const filename = generateFile(true);

      let err;
      try {
        await controller.handleDeletion(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(deleteFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should skip the deletion when the file is older than the offset and the opendata folder exists but the compressed file was not generated', async () => {
      const filename = generateFile(true);

      const opendataFolder = `${opendataPath}/${filename}`;
      fs.ensureDirSync(opendataFolder);

      let err;
      try {
        await controller.handleDeletion(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(deleteFileSpy).not.toHaveBeenCalled();

        fs.rmdirSync(opendataFolder);
      }
    });

    test('should delete the original backup file when the file is older than the offset and both opendata folder and compressed file exist', async () => {
      const filename = generateFile(true);

      const originalBackup = `${localPath}/${filename}`;
      const compressedFile = `${localPath}/${filename}.zip`;
      const opendataFolder = `${opendataPath}/${filename}`;
      fs.ensureDirSync(originalBackup);
      fs.createFileSync(compressedFile);
      fs.ensureDirSync(opendataFolder);

      let err;
      try {
        await controller.handleDeletion(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(deleteFileSpy).toHaveBeenCalledWith(originalBackup);

        fs.remove(originalBackup);
        fs.remove(compressedFile);
        fs.remove(opendataFolder);
      }
    });
  });

  describe('handleBatchProcess', () => {
    test('should skip a file that does not match the pattern YYYY-mm-dd', async () => {
      const filename = 'not_a_file_with_pattern';
      const otherFile = `${localPath}/${filename}`;
      fs.createFileSync(otherFile);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).not.toHaveBeenCalled();
        expect(deleteFileSpy).not.toHaveBeenCalled();

        fs.remove(otherFile);
      }
    });

    test('should skip a file with the pattern YYYY-mm-dd.zip', async () => {
      const filename = generateFile(true);
      const originalBackup = `${localPath}/${filename}.zip`;
      fs.writeFileSync(originalBackup);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.compressFile).not.toHaveBeenCalled();
        expect(deleteFileSpy).not.toHaveBeenCalled();

        fs.remove(originalBackup);
      }
    });

    test('should compress the file but not delete it according to the delete conditions', async () => {
      const filename = generateFile(false);

      const originalBackup = `${localPath}/${filename}`;
      fs.ensureDir(originalBackup);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).toHaveBeenCalledWith(originalBackup);
        expect(compressFileSpy).toHaveBeenCalledTimes(1);
        expect(deleteFileSpy).not.toHaveBeenCalled();

        fs.remove(originalBackup);
        fs.remove(`${originalBackup}.zip`);
      }
    });
  });
});