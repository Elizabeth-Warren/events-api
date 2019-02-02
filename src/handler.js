const { framework, router } = require('@ewarren/serverless-routing');
const AWS = require('aws-sdk');

const s3 = new AWS.S3();
const app = framework({ basePath: '/events' });

require('./routes/events')({
  app, s3,
});

module.exports.router = router(app);
