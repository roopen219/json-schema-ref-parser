const chai = require('chai');
const chaiSubset = require('chai-subset');

const $RefParser = require('../../../lib');
const { JSONParserErrorGroup, InvalidPointerError } = require('../../../lib/util/errors');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const { expect } = chai;
chai.use(chaiSubset);

describe('Schema with invalid pointers', function () {
  it('should throw an error for an invalid pointer', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/invalid-pointers/invalid.json'));
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(InvalidPointerError);
      expect(err.message).to.contain('Invalid $ref pointer "f". Pointers must begin with "#/"');
    }
  });

  it('should throw a grouped error for an invalid pointer if continueOnError is true', async function () {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.rel('specs/invalid-pointers/invalid.json'), { continueOnError: true });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.files).to.equal(parser);
      expect(err.message).to.equal(
        `1 error occurred while reading '${path.abs('specs/invalid-pointers/invalid.json')}'`
      );
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          message: 'Invalid $ref pointer "f". Pointers must begin with "#/"',
          path: ['foo'],
          source: path.unixify(path.abs('specs/invalid-pointers/invalid.json')),
        },
      ]);
    }
  });
});
