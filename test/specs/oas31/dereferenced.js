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
      description: "Someone's name",
      type: 'string',
    },
    secretName: {
      description: "Someone's secret name",
      type: 'string',
    },
  },
  title: 'Person',
};
