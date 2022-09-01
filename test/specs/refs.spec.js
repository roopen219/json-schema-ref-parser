const { host } = require('@jsdevtools/host-environment');
const { expect } = require('chai');

const $RefParser = require('../../lib');
const helper = require('../utils/helper');
const path = require('../utils/path');

const bundledSchema = require('./external/bundled');
const dereferencedSchema = require('./external/dereferenced');
const parsedSchema = require('./external/parsed');

describe('$Refs object', function () {
  describe('paths', function () {
    it('should only contain the main file when calling `parse()`', async function () {
      const parser = new $RefParser();
      await parser.parse(path.abs('specs/external/external.yaml'));
      const paths = parser.$refs.paths();
      expect(paths).to.have.same.members([path.abs('specs/external/external.yaml')]);
    });

    it('should contain all files when calling `resolve()`', async function () {
      const parser = new $RefParser();
      const $refs = await parser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs).to.equal(parser.$refs);
      const paths = $refs.paths();
      expect(paths).to.have.same.members([
        path.abs('specs/external/external.yaml'),
        path.abs('specs/external/definitions/definitions.json'),
        path.abs('specs/external/definitions/name.yaml'),
        path.abs('specs/external/definitions/required-string.yaml'),
      ]);
    });

    it('should return only local files', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const paths = $refs.paths('file');
      if (host.node) {
        expect(paths).to.have.same.members([
          path.abs('specs/external/external.yaml'),
          path.abs('specs/external/definitions/definitions.json'),
          path.abs('specs/external/definitions/name.yaml'),
          path.abs('specs/external/definitions/required-string.yaml'),
        ]);
      } else {
        expect(paths).to.be.an('array').with.lengthOf(0);
      }
    });

    it('should return only URLs', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const paths = $refs.paths(['http']);
      if (host.browser) {
        expect(paths).to.have.same.members([
          path.url('specs/external/external.yaml'),
          path.url('specs/external/definitions/definitions.json'),
          path.url('specs/external/definitions/name.yaml'),
          path.url('specs/external/definitions/required-string.yaml'),
        ]);
      } else {
        expect(paths).to.be.an('array').with.lengthOf(0);
      }
    });
  });

  describe('values', function () {
    it('should be the same as `toJSON()`', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.values).to.equal($refs.toJSON);
    });

    it('should return the paths and values of all resolved files', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const expected = {};
      expected[path.abs('specs/external/external.yaml')] = parsedSchema.schema;
      expected[path.abs('specs/external/definitions/definitions.json')] = parsedSchema.definitions;
      expected[path.abs('specs/external/definitions/name.yaml')] = parsedSchema.name;
      expected[path.abs('specs/external/definitions/required-string.yaml')] = parsedSchema.requiredString;
      const values = $refs.values();
      expect(values).to.deep.equal(expected);
    });

    it('should return the paths and values of all dereferenced files', async function () {
      const parser = new $RefParser();
      await parser.dereference(path.abs('specs/external/external.yaml'));
      const expected = {};
      expected[path.abs('specs/external/external.yaml')] = dereferencedSchema;
      expected[path.abs('specs/external/definitions/definitions.json')] = dereferencedSchema.definitions;
      expected[path.abs('specs/external/definitions/name.yaml')] = dereferencedSchema.definitions.name;
      expected[path.abs('specs/external/definitions/required-string.yaml')] =
        dereferencedSchema.definitions['required string'];
      const values = parser.$refs.values();
      expect(values).to.deep.equal(expected);
    });

    it('should return the paths and values of all bundled files', async function () {
      const parser = new $RefParser();
      await parser.bundle(path.abs('specs/external/external.yaml'));
      const expected = {};
      expected[path.abs('specs/external/external.yaml')] = bundledSchema;
      expected[path.abs('specs/external/definitions/definitions.json')] = bundledSchema.definitions;
      expected[path.abs('specs/external/definitions/name.yaml')] = bundledSchema.definitions.name;
      expected[path.abs('specs/external/definitions/required-string.yaml')] =
        bundledSchema.definitions['required string'];
      const values = parser.$refs.values();
      expect(values).to.deep.equal(expected);
    });

    it('should return only local files and values', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      let values = $refs.values('file');
      if (host.node) {
        const expected = {};
        expected[path.abs('specs/external/external.yaml')] = parsedSchema.schema;
        expected[path.abs('specs/external/definitions/definitions.json')] = parsedSchema.definitions;
        expected[path.abs('specs/external/definitions/name.yaml')] = parsedSchema.name;
        expected[path.abs('specs/external/definitions/required-string.yaml')] = parsedSchema.requiredString;
        values = $refs.values();
        expect(values).to.deep.equal(expected);
      } else {
        expect(values).to.be.an('object').and.empty;
      }
    });

    it('should return only URLs and values', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      let values = $refs.values(['http']);
      if (host.browser) {
        const expected = {};
        expected[path.url('specs/external/external.yaml')] = parsedSchema.schema;
        expected[path.url('specs/external/definitions/definitions.json')] = parsedSchema.definitions;
        expected[path.url('specs/external/definitions/name.yaml')] = parsedSchema.name;
        expected[path.url('specs/external/definitions/required-string.yaml')] = parsedSchema.requiredString;
        values = $refs.values();
        expect(values).to.deep.equal(expected);
      } else {
        expect(values).to.be.an('object').and.empty;
      }
    });
  });

  describe('exists', function () {
    it('should work with absolute paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.exists(path.abs('specs/external/external.yaml'))).to.equal(true);
      expect($refs.exists(path.abs('specs/external/definitions/definitions.json'))).to.equal(true);
      expect($refs.exists(path.abs('specs/external/definitions/name.yaml'))).to.equal(true);
      expect($refs.exists(path.abs('specs/external/definitions/required-string.yaml'))).to.equal(true);
    });

    it('should work with relative paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.exists('external.yaml')).to.equal(true);
      expect($refs.exists('definitions/definitions.json')).to.equal(true);
      expect($refs.exists('definitions/name.yaml')).to.equal(true);
      expect($refs.exists('definitions/required-string.yaml')).to.equal(true);
    });

    it('should return false if the $ref does not exist', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.exists('foo bar')).to.equal(false);
    });
  });

  describe('get', function () {
    it('should work with absolute paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.get(path.abs('specs/external/external.yaml'))).to.deep.equal(parsedSchema.schema);
      expect($refs.get(path.abs('specs/external/definitions/definitions.json'))).to.deep.equal(
        parsedSchema.definitions
      );
      expect($refs.get(path.abs('specs/external/definitions/name.yaml'))).to.deep.equal(parsedSchema.name);
      expect($refs.get(path.abs('specs/external/definitions/required-string.yaml'))).to.deep.equal(
        parsedSchema.requiredString
      );
    });

    it('should work with relative paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.get('external.yaml')).to.deep.equal(parsedSchema.schema);
      expect($refs.get('definitions/definitions.json')).to.deep.equal(parsedSchema.definitions);
      expect($refs.get('definitions/name.yaml')).to.deep.equal(parsedSchema.name);
      expect($refs.get('definitions/required-string.yaml')).to.deep.equal(parsedSchema.requiredString);
    });

    it('should get the entire file if there is no hash', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const value = $refs.get('definitions/name.yaml');
      expect(value).to.deep.equal(parsedSchema.name);
    });

    it('should get the entire file if the hash is empty', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const value = $refs.get('definitions/name.yaml#');
      expect(value).to.deep.equal(parsedSchema.name);
    });

    it('should try to get an empty key if the hash is "#/"', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));

      try {
        $refs.get('definitions/name.yaml#/');
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Token "" does not exist.');
      }
    });

    it('should resolve values across multiple files if necessary', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      expect($refs.get('external.yaml#/properties/name/properties/first')).to.deep.equal({
        title: 'required string',
        type: 'string',
        minLength: 1,
      });
      expect($refs.get('external.yaml#/properties/name/properties/first/title')).to.equal('required string');
    });

    it('should throw an error if the file does not exist', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));

      try {
        $refs.get('foo-bar.yaml#/some/value');
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/value".');
        expect(err.message).to.contain('foo-bar.yaml" not found.');
      }
    });

    it('should throw an error if the JSON Pointer path does not exist', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));

      try {
        $refs.get('external.yaml#/foo/bar');
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.equal('Token "foo" does not exist.');
      }
    });
  });

  describe('set', function () {
    it('should work with absolute paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      const $ref = `${path.abs('specs/external/external.yaml')}#/properties/name`;
      $refs.set($ref, { foo: 'bar' });
      expect($refs.get('external.yaml#/properties/name')).to.deep.equal({ foo: 'bar' });
    });

    it('should work with relative paths', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      $refs.set('external.yaml#/properties/name', { foo: 'bar' });
      expect($refs.get('external.yaml#/properties/name')).to.deep.equal({ foo: 'bar' });
    });

    it('should resolve values across multiple files if necessary', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      $refs.set('external.yaml#/properties/name/properties/first/title', 'foo bar');
      expect($refs.get('external.yaml#/properties/name/properties/first/title')).to.equal('foo bar');
    });

    it('should throw an error if the file does not exist', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));

      try {
        $refs.set('foo-bar.yaml#/some/path', 'some value');
        helper.shouldNotGetCalled();
      } catch (err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err.message).to.contain('Error resolving $ref pointer "foo-bar.yaml#/some/path".');
        expect(err.message).to.contain('foo-bar.yaml" not found.');
      }
    });

    it('should NOT throw an error if the JSON Pointer path does not exist (it creates the new value instead)', async function () {
      const $refs = await $RefParser.resolve(path.abs('specs/external/external.yaml'));
      $refs.set('external.yaml#/foo/bar/baz', { hello: 'world' });
      expect($refs.get('external.yaml#/foo/bar/baz')).to.deep.equal({ hello: 'world' });
    });
  });
});
