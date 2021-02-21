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

  afterEach(() => {
    fs.removeSync(localPath);
    fs.removeSync(opendataPath);
    fs.ensureDirSync(localPath);
    fs.ensureDirSync(opendataPath);
    jest.clearAllMocks();
  });

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

      const originalBackup = `${localPath}/${filename}`;
      const opendataFolder = `${opendataPath}/${filename}`;
      fs.ensureDirSync(originalBackup);
      fs.ensureDirSync(opendataFolder);

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

        expect(compressFileSpy).not.toHaveBeenCalled();
        expect(deleteFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should skip a file that has not opendata counterpart', async () => {
      const filename = generateFile(true);
      const originalBackup = `${localPath}/${filename}`;
      fs.ensureDirSync(originalBackup);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).not.toHaveBeenCalled();
        expect(deleteFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should skip the compression of a file that has already been compressed', async () => {
      const filename = generateFile(true);
      const originalBackup = `${localPath}/${filename}`;
      const originalBackupCompressed = `${localPath}/${filename}.zip`;
      const opendataFile = `${opendataPath}/${filename}`;

      fs.ensureDirSync(originalBackup);
      fs.ensureDirSync(opendataFile);
      fs.ensureFileSync(originalBackupCompressed);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should compress a file that has not been compressed', async () => {
      const filename = generateFile(true);
      const originalBackup = `${localPath}/${filename}`;
      const opendataFile = `${opendataPath}/${filename}`;

      fs.ensureDirSync(originalBackup);
      fs.ensureDirSync(opendataFile);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).toHaveBeenCalledWith(originalBackup);
      }
    });

    test('should delete a file when it matches the YYYY-mm-dd pattern and it has a opendata counterpart', async () => {
      const filename = generateFile(true);

      const originalBackup = `${localPath}/${filename}`;
      const originalBackupCompressed = `${localPath}/${filename}.zip`;
      const opendataFile = `${opendataPath}/${filename}`;

      fs.ensureDirSync(originalBackup);
      fs.ensureDirSync(opendataFile);
      fs.ensureFileSync(originalBackupCompressed);

      let err;
      try {
        await controller.handleBatchProcess();
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(deleteFileSpy).toHaveBeenCalledWith(originalBackup);
      }
    });
  });
});
