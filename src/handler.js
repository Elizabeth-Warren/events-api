const { framework, router } = require('@ewarren/serverless-routing');
const AWS = require('aws-sdk');
const importEvents = require('./tasks/importEvents');

const app = framework({ basePath: '/:stage-events-v2' });

require('./routes/events')(app);

module.exports = {
  router: router(app),
  importEvents: (event, context, callback) => {
    importEvents().then(
      () => callback(null, { message: 'Finished importing events.' }),
      reason => callback(true, reason)
    );
  }
};
