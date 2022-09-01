const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const bundledSchema = require('./bundled');
const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with a top-level (root) $ref', function () {
  it('should parse successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/root/root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/root/root.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/root/root.yaml'),
      path.abs('specs/root/root.yaml'),
      parsedSchema.schema,
      path.abs('specs/root/definitions/root.json'),
      parsedSchema.root,
      path.abs('specs/root/definitions/extended.yaml'),
      parsedSchema.extended,
      path.abs('specs/root/definitions/name.yaml'),
      parsedSchema.name
    )
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/root/root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.first).to.equal(schema.properties.last);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it('should bundle successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/root/root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
