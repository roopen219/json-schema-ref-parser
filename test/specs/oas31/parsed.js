module.exports = {
  required: ['name'],
  type: 'object',
  definitions: {
    name: {
      type: 'string',
      description: "Someone's name",
    },
  },
  properties: {
    name: {
      $ref: '#/definitions/name',
    },
    secretName: {
      $ref: '#/definitions/name',
      description: "Someone's secret name",
    },
  },
  title: 'Person',
};
