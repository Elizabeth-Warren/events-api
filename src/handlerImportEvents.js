const importEvents = require('tasks/importEvents');

module.exports.run = (event, context, callback) => {
  importEvents.then(
    () => callback(null, { message: 'Imported events.' }),
    (reason) => callback(true, reason)
  );
}
