const { framework, router } = require('@ewarren/serverless-routing');
const AWS = require('aws-sdk');
const importEvents = require('./tasks/importEvents');

const app = framework({ basePath: '/:stage-events-v2' });

require('./routes/events')(app);

module.exports = {
  router: router(app),
  importEvents: async () => {
    return importEvents();
  }
};
