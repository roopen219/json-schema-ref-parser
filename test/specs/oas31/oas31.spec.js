const { expect } = require('chai');

const $RefParser = require('../../../lib');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with OpenAPI 3.1 $ref description/schema overrides', function () {
  it('should parse successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/oas31/oas31.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(path.rel('specs/oas31/oas31.yaml'), path.abs('specs/oas31/oas31.yaml'), parsedSchema)
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });
});
