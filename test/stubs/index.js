const mockAwsPromise = (returnValue) => () => ({ promise: async () => (returnValue) });

module.exports = {
  mockAwsPromise,
};
