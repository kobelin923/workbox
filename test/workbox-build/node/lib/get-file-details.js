const expect = require('chai').expect;
const path = require('path');
const proxyquire = require('proxyquire');

const errors = require('../../../../packages/workbox-build/src/lib/errors');

describe(`[workbox-build] lib/get-file-details.js`, function() {
  const MODULE_PATH = '../../../../packages/workbox-build/src/lib/get-file-details';
  const GLOB_DIRECTORY = './';
  const GLOB_PATTERN = 'file*';
  const DIRECTORY = 'directory';
  const FILE1 = 'file1.txt';
  const FILE2 = 'file2.js';
  const SIZE = 1234;
  const HASH = 'example-hash';

  it(`should throw when there's a glob.sync() error`, function() {
    const getFileDetails = proxyquire(MODULE_PATH, {
      glob: {
        sync: () => {
          throw new Error();
        },
      },
    });

    try {
      getFileDetails({
        globDirectory: GLOB_DIRECTORY,
        globPattern: GLOB_PATTERN,
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['unable-to-glob-files']);
    }
  });

  it(`should throw when the pattern doesn't match anything`, function() {
    const getFileDetails = proxyquire(MODULE_PATH, {
      glob: {
        sync: () => [],
      },
    });

    try {
      getFileDetails({
        globDirectory: GLOB_DIRECTORY,
        globPattern: GLOB_PATTERN,
      });
      throw new Error('Unexpected success.');
    } catch (error) {
      expect(error.message).to.have.string(errors['useless-glob-pattern']);
    }
  });

  it(`should return array of file details, without null values`, function() {
    const getFileDetails = proxyquire(MODULE_PATH, {
      'glob': {
        sync: () => {
          return [FILE1, FILE2, DIRECTORY];
        },
      },
      './get-file-size': (value) => {
        if (path.normalize(value) === path.normalize(DIRECTORY)) {
          return null;
        }
        return SIZE;
      },
      './get-file-hash': (value) => {
        if (path.normalize(value) === path.normalize(DIRECTORY)) {
          throw new Error(`getFileHash(${DIRECTORY}) shouldn't have been called.`);
        }
        return HASH;
      },
    });

    const details = getFileDetails({
      globDirectory: GLOB_DIRECTORY,
      globPattern: GLOB_PATTERN,
    });

    expect(details).to.deep.equal([{
      file: FILE1,
      hash: HASH,
      size: SIZE,
    }, {
      file: FILE2,
      hash: HASH,
      size: SIZE,
    }]);
  });
});
