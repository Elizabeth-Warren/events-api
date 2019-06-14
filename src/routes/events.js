const { HttpError } = require('@ewarren/serverless-routing');
const EventModel = require('../models/Event');
const { mongoDocumentToResponse } = require('../transformers/event');
const { connectToDatabase } = require('../utils/connectToDatabase');
const zipcodes = require('zipcodes');

function parseLocParams(event) {
  const { queryStringParameters } = event;

  var {
    lat = null,
    lon = null,
    zip = null,
  } = (queryStringParameters || {});

  if (zip && !lat && !lon) {
    z = zipcodes.lookup(zip);
    if (z) {
      lat = z.latitude;
      lon = z.longitude;
    }
  }

  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
  }
}

module.exports = (app) => {
  app.get('/upcoming', async ({ success, failed, context }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDatabase();
    const Event = EventModel(db);
    const upcomingEvents = await Event.getUpcomingEvents();

    if (upcomingEvents instanceof HttpError) {
      return failed(upcomingEvents);
    }

    return success({ events: upcomingEvents.map(mongoDocumentToResponse) });
  });

  app.get('/nearby', async ({ success, failed, event, context }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDatabase();
    const { lat, lon } = parseLocParams(event);

    if (isNaN(lat) || isNaN(lon)) {
      return failed(new HttpError('Missing valid lat/lon or zip.'), 400);
    }

    const Event = EventModel(db);
    const events = await Event.getEventsNearPoint(lon, lat);

    if (events instanceof HttpError) {
      return failed(events);
    }

    return success({ events: events.map(mongoDocumentToResponse) });
  });

  app.get('/upcomingHighPriorityAndNearby', async ({ success, failed, event, context }) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const db = await connectToDatabase();
    const { lat, lon } = parseLocParams(event);

    if (isNaN(lat) || isNaN(lon)) {
      return failed(new HttpError('Missing valid lat/lon or zip.'), 400);
    }

    const Event = EventModel(db);
    const events = await Event.getUpcomingHighPriorityAndNearbyEvents(lon, lat);

    if (events instanceof HttpError) {
      return failed(events);
    }

    return success({ events: events.map(mongoDocumentToResponse) });
  });
};
