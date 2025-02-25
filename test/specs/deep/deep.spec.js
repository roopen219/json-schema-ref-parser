const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const bundledSchema = require('./bundled');
const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with deeply-nested $refs', function () {
  it('should parse successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/deep/deep.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/deep/deep.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/deep/deep.yaml'),
      path.abs('specs/deep/deep.yaml'),
      parsedSchema.schema,
      path.abs('specs/deep/definitions/name.yaml'),
      parsedSchema.name,
      path.abs('specs/deep/definitions/required-string.yaml'),
      parsedSchema.requiredString
    )
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/deep/deep.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // Reference equality
    expect(schema.properties.name.type)
      .to.equal(schema.properties['level 1'].properties.name.type)
      .to.equal(schema.properties['level 1'].properties['level 2'].properties.name.type)
      .to.equal(schema.properties['level 1'].properties['level 2'].properties['level 3'].properties.name.type)
      .to.equal(
        schema.properties['level 1'].properties['level 2'].properties['level 3'].properties['level 4'].properties.name
          .type
      );

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/deep/deep.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
