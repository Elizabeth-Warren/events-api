const { HttpError } = require('@ewarren/serverless-routing');
const EventModel = require('../models/Event');
const transformEvents = require('../transformers/event');
const { setupDatabase } = require('../utils/connectToDatabase');

module.exports = (app) => {
  app.get('/upcoming', async ({ success, failed, event }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await setupDatabase();
    const Event = EventModel(db);
    const upcomingEvents = await Event.getUpcomingEvents();

    if (upcomingEvents instanceof HttpError) {
      return failed(upcomingEvents);
    }

    return success({ events: transformEvents(upcomingEvents) });
  });

  app.get('/nearby', async ({ success, failed, event }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await setupDatabase();
    const { queryStringParameters } = event;

    const {
      lat = null,
      lon = null,
    } = (queryStringParameters || {});

    const latFloat = parseFloat(lat);
    const lonFloat = parseFloat(lon);

    if (isNaN(latFloat) || isNaN(lonFloat)) {
      return failed(new HttpError('Missing lat/lon.'), 400);
    }

    const Event = EventModel(db);
    const nearbyEvents = await Event.getEventsNearPoint(lonFloat, latFloat);

    if (nearbyEvents instanceof HttpError) {
      return failed(nearbyEvents);
    }

    return success({ events: transformEvents(nearbyEvents) });
  });
};
