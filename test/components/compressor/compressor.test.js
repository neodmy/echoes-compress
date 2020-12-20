const path = require('path');
const fs = require('fs-extra');

const system = require('../../../system');

const {
  compressor: { localPath },
} = require('../../../config/test');

describe('Compressor component tests', () => {
  const sys = system();
  let compressor;
  let archiver;

  let compressFileSpy;
  let deleteFileSpy;

  beforeAll(async () => {
    ({ compressor, archiver } = await sys.start());
    compressFileSpy = jest.spyOn(archiver, 'compressFile');
    deleteFileSpy = jest.spyOn(archiver, 'deleteFile');
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => sys.stop());

  describe('handleCompression', () => {
    test('should handle an error silently when the file to compress does not exist', async () => {
      const filename = 'not_a_file';

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(compressFileSpy).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(deleteFileSpy).not.toHaveBeenCalled();
      }
    });

    test('should compress and delete the file', async () => {
      const filename = '2020-09-10';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      fs.copySync(originalFixture, copiedFixture);

      let err;
      try {
        await compressor.handleCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));

        fs.removeSync(`${copiedFixture}.zip`);
      }
    });
  });

  describe('handleInitialCompression', () => {
    test('should skip a file that does not match the pattern YYYY-mm-dd', async () => {
      const filename = 'not_a_file_with_pattern';
      const originalFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      fs.writeFileSync(originalFixture);

      let err;
      try {
        await compressor.handleInitialCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.compressFile).not.toHaveBeenCalled();
        expect(archiver.deleteFile).not.toHaveBeenCalled();

        fs.removeSync(originalFixture);
      }
    });

    test('should compress and delete the file', async () => {
      const filename = '2020-09-10';
      const filename2 = '2020-09-11';
      const originalFixture = path.join(__dirname, `../../fixtures/original/echoes/${filename}`);
      const copiedFixture = path.join(__dirname, `../../fixtures/temp/echoes/${filename}`);
      const copiedFixture2 = path.join(__dirname, `../../fixtures/temp/echoes/${filename2}`);
      fs.copySync(originalFixture, copiedFixture);
      fs.copySync(originalFixture, copiedFixture2);

      let err;
      try {
        await compressor.handleInitialCompression(filename);
      } catch (error) {
        err = error;
      } finally {
        expect(err).toBeUndefined();

        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(archiver.compressFile).toHaveBeenCalledWith(path.join(localPath, filename2));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename));
        expect(archiver.deleteFile).toHaveBeenCalledWith(path.join(localPath, filename2));

        fs.removeSync(`${copiedFixture}.zip`);
        fs.removeSync(`${copiedFixture2}.zip`);
      }
    });
  });
});
