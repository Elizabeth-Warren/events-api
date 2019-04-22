const EventModel = require('../../src/models/Event');

const mockAwsPromise = (returnValue) => () => ({ promise: async () => (returnValue) });

const s3ify = (value) => Buffer.from(JSON.stringify(JSON.stringify(value)));

module.exports = {
  mockAwsPromise,
  s3ify,
};
