const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with circular (recursive) $refs', function () {
  describe('$ref to self', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular/circular-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-self.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular/circular-self.yaml'),
        path.abs('specs/circular/circular-self.yaml'),
        parsedSchema.self
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');

      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should double dereference successfully', async function () {
      const firstPassSchema = await $RefParser.dereference(path.rel('specs/circular/circular-self.yaml'));
      const parser = new $RefParser();
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');

      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should produce the same results if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-self.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular/circular-self.yaml'), { dereference: { circular: false } });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular/circular-self.yaml#/definitions/thing');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular/circular-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('$ref to ancestor', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular/circular-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-ancestor.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular/circular-ancestor.yaml'),
        path.abs('specs/circular/circular-ancestor.yaml'),
        parsedSchema.ancestor
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/person/properties/spouse');

      // Reference equality
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should double dereference successfully', async function () {
      const parser = new $RefParser();
      const firstPassSchema = await $RefParser.dereference(path.rel('specs/circular/circular-ancestor.yaml'));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/person/properties/spouse');

      // Reference equality
      expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-ancestor.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/person/properties/spouse');

      // Reference equality
      expect(schema.definitions.person.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular/circular-ancestor.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular/circular-ancestor.yaml#/definitions/person/properties/spouse');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/person/properties/spouse');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular/circular-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('indirect circular $refs', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular/circular-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-indirect.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular/circular-indirect.yaml'),
        path.abs('specs/circular/circular-indirect.yaml'),
        parsedSchema.indirect
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/parents/items');

      // Reference equality
      expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
    });

    it('should double dereference successfully', async function () {
      const parser = new $RefParser();
      const firstPassSchema = await $RefParser.dereference(path.rel('specs/circular/circular-indirect.yaml'));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain(
        '#/definitions/parent/properties/children/items/properties/parents/items'
      );

      // Reference equality
      expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-indirect.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/parents/items');

      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular/circular-indirect.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain(
          'specs/circular/circular-indirect.yaml#/definitions/child/properties/parents/items'
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/parents/items');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular/circular-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('indirect circular and ancestor $refs', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular/circular-indirect-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular/circular-indirect-ancestor.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular/circular-indirect-ancestor.yaml'),
        path.abs('specs/circular/circular-indirect-ancestor.yaml'),
        parsedSchema.indirectAncestor
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/children/items');

      // Reference equality
      expect(schema.definitions.parent.properties.child).to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.children.items).to.equal(schema.definitions.child);
    });

    it('should double dereference successfully', async function () {
      const parser = new $RefParser();
      const firstPassSchema = await parser.dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'));
      const schema = await parser.dereference(firstPassSchema);
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain(
        '#/definitions/parent/properties/child/properties/children/items'
      );

      // Reference equality
      expect(schema.definitions.parent.properties.child).to.equal(schema.definitions.child);
      expect(schema.definitions.child.properties.children.items).to.equal(schema.definitions.child);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/children/items');

      // Reference equality
      expect(schema.definitions.child.properties.pet).to.equal(schema.definitions.pet);
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular/circular-indirect-ancestor.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular/circular-indirect-ancestor.yaml#/definitions/child/properties');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/child/properties/children/items');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular/circular-indirect-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });
});
