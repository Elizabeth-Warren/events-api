const { framework, router } = require('@ewarren/serverless-routing');
const AWS = require('aws-sdk');

const app = framework({ basePath: '/:stage-events' });

require('./routes/events')(app);

module.exports.router = router(app);
