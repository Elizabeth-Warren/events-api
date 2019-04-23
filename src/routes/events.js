const { HttpError } = require('@ewarren/serverless-routing');
const EventModel = require('../models/Event');
const transformEvents = require('../transformers/event');
const { connectToDatabase } = require('../utils/connectToDatabase');

module.exports = ({ app }) => {
  app.get('/upcoming', async ({ success, failed, event }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDatabase();
    const Event = EventModel(db);
    const upcomingEvents = await Event.getUpcomingEvents();

    if (upcomingEvents instanceof HttpError) {
      return failed(upcomingEvents);
    }

    return success({ events: transformEvents(upcomingEvents) });
  });

  app.get('/nearby', async ({ success, failed, event }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDatabase();
    const { queryStringParameters } = event;

    const {
      lat = null,
      lon = null,
    } = (queryStringParameters || {});

    const formattedLat = parseFloat(lat);
    const formattedLon = parseFloat(lon);

    if (isNaN(formattedLat) || isNaN(formattedLon)) {
      return failed(new HttpError('Missing lat/lon.'), 400);
    }

    const Event = EventModel(db);
    const nearbyEvents = await Event.getEventsNearPoint(formattedLon, formattedLat);

    if (nearbyEvents instanceof HttpError) {
      return failed(nearbyEvents);
    }

    return success({ events: transformEvents(nearbyEvents) });
  });
};
