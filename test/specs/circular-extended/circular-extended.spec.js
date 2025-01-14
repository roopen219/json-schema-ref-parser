const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const bundledSchema = require('./bundled');
const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with circular $refs that extend each other', function () {
  describe('$ref to self', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular-extended/circular-extended-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.self);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-self.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular-extended/circular-extended-self.yaml'),
        path.abs('specs/circular-extended/circular-extended-self.yaml'),
        parsedSchema.self,
        path.abs('specs/circular-extended/definitions/thing.yaml'),
        parsedSchema.thing
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.self);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'), {
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
        await parser.dereference(path.rel('specs/circular-extended/circular-extended-self.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular-extended/circular-extended-self.yaml#/definitions/thing');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular-extended/circular-extended-self.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.self);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('$ref to ancestor', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.ancestor);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-ancestor.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular-extended/circular-extended-ancestor.yaml'),
        path.abs('specs/circular-extended/circular-extended-ancestor.yaml'),
        parsedSchema.ancestor,
        path.abs('specs/circular-extended/definitions/person-with-spouse.yaml'),
        parsedSchema.personWithSpouse,
        path.abs('specs/circular-extended/definitions/pet.yaml'),
        parsedSchema.pet,
        path.abs('specs/circular-extended/definitions/animals.yaml'),
        parsedSchema.animals
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties/spouse');

      // Reference equality
      expect(schema.definitions.person.properties.spouse.properties).to.equal(schema.definitions.person.properties);
      expect(schema.definitions.person.properties.pet.properties).to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.ancestor.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties/spouse');
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain(
          'specs/circular-extended/definitions/person-with-spouse.yaml#/properties/spouse'
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/properties/spouse');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular-extended/circular-extended-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.ancestor);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('indirect circular $refs', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular-extended/circular-extended-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirect);
      expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-extended/circular-extended-indirect.yaml')]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular-extended/circular-extended-indirect.yaml'),
        path.abs('specs/circular-extended/circular-extended-indirect.yaml'),
        parsedSchema.indirect,
        path.abs('specs/circular-extended/definitions/parent-with-children.yaml'),
        parsedSchema.parentWithChildren,
        path.abs('specs/circular-extended/definitions/child-with-parents.yaml'),
        parsedSchema.childWithParents,
        path.abs('specs/circular-extended/definitions/pet.yaml'),
        parsedSchema.pet,
        path.abs('specs/circular-extended/definitions/animals.yaml'),
        parsedSchema.animals
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties/parents/items');

      // Reference equality
      expect(schema.definitions.parent.properties.children.items.properties).to.equal(
        schema.definitions.child.properties
      );
      expect(schema.definitions.child.properties.parents.items.properties).to.equal(
        schema.definitions.parent.properties
      );
      expect(schema.definitions.child.properties.pet.properties).to.equal(schema.definitions.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {
        dereference: { circular: 'ignore' },
      });
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirect.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties/parents/items');
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular-extended/circular-extended-indirect.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain(
          'specs/circular-extended/definitions/child-with-parents.yaml#/properties/parents/items'
        );

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/properties/parents/items');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular-extended/circular-extended-indirect.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.indirect);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });

  describe('indirect circular and ancestor $refs', function () {
    it('should parse successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.parse(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(parsedSchema.indirectAncestor);
      expect(parser.$refs.paths()).to.deep.equal([
        path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
      ]);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
        path.abs('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
        parsedSchema.indirectAncestor,
        path.abs('specs/circular-extended/definitions/parent-with-child.yaml'),
        parsedSchema.parentWithChild,
        path.abs('specs/circular-extended/definitions/child-with-children.yaml'),
        parsedSchema.childWithChildren,
        path.abs('specs/circular-extended/definitions/pet.yaml'),
        parsedSchema.pet,
        path.abs('specs/circular-extended/definitions/animals.yaml'),
        parsedSchema.animals
      )
    );

    it('should dereference successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml')
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.fullyDereferenced);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties');

      // Reference equality
      expect(schema.definitions.parent.properties.child.properties).to.equal(schema.definitions.child.properties);
      expect(schema.definitions.child.properties.children.items.properties).to.equal(
        schema.definitions.child.properties
      );
      expect(schema.definitions.pet.properties).to.equal(schema.definitions.child.properties.pet.properties);
    });

    it('should not dereference circular $refs if "options.$refs.circular" is "ignore"', async function () {
      const parser = new $RefParser();
      const schema = await parser.dereference(
        path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'),
        { dereference: { circular: 'ignore' } }
      );
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(dereferencedSchema.indirectAncestor.ignoreCircular$Refs);

      // The "circular" flag should be set
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(2);
      expect(parser.$refs.circularRefs[0]).to.contain('#/properties');
      expect(parser.$refs.circularRefs[1]).to.contain('#/properties/children/items');
    });

    it('should throw an error if "options.$refs.circular" is false', async function () {
      const parser = new $RefParser();

      try {
        await parser.dereference(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'), {
          dereference: { circular: false },
        });
        helper.shouldNotGetCalled();
      } catch (err) {
        // A ReferenceError should have been thrown
        expect(err).to.be.an.instanceOf(ReferenceError);
        expect(err.message).to.contain('Circular $ref pointer found at ');
        expect(err.message).to.contain('specs/circular-extended/definitions/child-with-children.yaml#/properties');

        // $Refs.circular should be true
        expect(parser.$refs.circular).to.equal(true);
        expect(parser.$refs.circularRefs).to.have.length(1);
        expect(parser.$refs.circularRefs[0]).to.contain('#/properties');
      }
    });

    it('should bundle successfully', async function () {
      const parser = new $RefParser();
      const schema = await parser.bundle(path.rel('specs/circular-extended/circular-extended-indirect-ancestor.yaml'));
      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(bundledSchema.indirectAncestor);

      // The "circular" flag should NOT be set
      // (it only gets set by `dereference`)
      expect(parser.$refs.circular).to.equal(false);
      expect(parser.$refs.circularRefs).to.have.length(0);
    });
  });
});
