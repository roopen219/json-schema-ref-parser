/* eslint-disable mocha/no-setup-in-describe */
const chai = require('chai');
const chaiSubset = require('chai-subset');
const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');
const { host } = require('@jsdevtools/host-environment');
const { InvalidPointerError, ResolverError, MissingPointerError } = require('../../../lib/util/errors');

const { expect } = chai;
chai.use(chaiSubset);

function skipIfWindows(name, callback) {
  // Some tests tests don't support Windows file paths that contain spaces.
  const fn = host.node && host.os.windows && path.cwd().includes(' ') ? it.skip : it;
  fn(name, callback);
}

describe('Report correct error source and path for', function () {
  it('schema with broken reference', async function () {
    const parser = new $RefParser();
    try {
      await parser.dereference({ foo: { bar: { $ref: 'I do not exist' } } }, { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: source => typeof source === 'string',
          path: ['foo', 'bar'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });

  skipIfWindows('schema with a local reference pointing at property with broken external reference', async function () {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs('specs/error-source/broken-external.json'), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: path.unixify(path.abs('specs/error-source/broken-external.json')),
          path: ['components', 'schemas', 'testSchema', 'properties', 'test'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });

  skipIfWindows(
    'schema with a missing local pointer and reference pointing at external file with broken external',
    async function () {
      const parser = new $RefParser();
      try {
        await parser.dereference(path.abs('specs/error-source/invalid-external.json'), { continueOnError: true });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err.errors).to.containSubset([
          {
            name: MissingPointerError.name,
            source: path.unixify(path.abs('specs/error-source/invalid-external.json')),
            path: ['foo', 'bar'],
            message: message => typeof message === 'string',
          },
          {
            name: ResolverError.name,
            source: path.unixify(path.abs('specs/error-source/broken-external.json')),
            path: ['components', 'schemas', 'testSchema', 'properties', 'test'],
            message: message => typeof message === 'string',
          },
        ]);
      }
    }
  );

  skipIfWindows('schema with an invalid pointer', async function () {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs('specs/error-source/invalid-pointer.json'), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          source: path.unixify(path.abs('specs/error-source/invalid-pointer.json')),
          path: ['foo', 'baz'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });
});
