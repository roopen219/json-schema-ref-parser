const { host } = require('@jsdevtools/host-environment');
const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Blank files', function () {
  let windowOnError;
  let testDone;

  beforeEach(function () {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = host.global.onerror;
    host.global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(function () {
    host.global.onerror = windowOnError;
  });

  describe('main file', function () {
    it('should throw an error for a blank YAML file', async function () {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.yaml'));
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('blank/files/blank.yaml');
        expect(err.message).to.contain('is not a valid JSON Schema');
      }
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', async function () {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.yaml'), { parse: { yaml: { allowEmpty: false } } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.yaml');
        expect(err.message).to.contain('Parsed value is empty');
      }
    });

    it('should throw an error for a blank JSON file', async function () {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.json'), { parse: { json: { allowEmpty: false } } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.json');
      }
    });
  });

  describe('referenced files', function () {
    it('should parse successfully', async function () {
      const schema = await $RefParser.parse(path.rel('specs/blank/blank.yaml'));
      expect(schema).to.deep.equal(parsedSchema.schema);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/blank/blank.yaml'),
        path.abs('specs/blank/blank.yaml'),
        parsedSchema.schema,
        path.abs('specs/blank/files/blank.yaml'),
        parsedSchema.yaml,
        path.abs('specs/blank/files/blank.json'),
        parsedSchema.json,
        path.abs('specs/blank/files/blank.txt'),
        parsedSchema.text,
        path.abs('specs/blank/files/blank.png'),
        parsedSchema.binary,
        path.abs('specs/blank/files/blank.foo'),
        parsedSchema.unknown
      )
    );

    it('should dereference successfully', async function () {
      const schema = await $RefParser.dereference(path.rel('specs/blank/blank.yaml'));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should bundle successfully', async function () {
      const schema = await $RefParser.bundle(path.rel('specs/blank/blank.yaml'));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should throw an error if "allowEmpty" is disabled', async function () {
      try {
        await $RefParser.dereference(path.rel('specs/blank/blank.yaml'), { parse: { binary: { allowEmpty: false } } });
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.png');
        expect(err.message).to.contain('Parsed value is empty');
      }
    });
  });
});
