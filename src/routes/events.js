const { HttpError } = require('@ewarren/serverless-routing');
const EventModel = require('../models/Event');
const transformEvents = require('../transformers/event');

module.exports = ({ app, s3 }) => {
  const Event = EventModel(s3);

  app.get('/upcoming', async ({ success, failed }) => {
    const upcomingEvents = await Event.getUpcomingEvents();

    if (upcomingEvents instanceof HttpError) {
      return failed(upcomingEvents);
    }

    return success({ events: transformEvents(upcomingEvents) });
  });

  app.get('/nearby', async ({ success, failed, event }) => {
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

    const nearbyEvents = await Event.getEventsNearPoint(formattedLon, formattedLat);

    if (nearbyEvents instanceof HttpError) {
      return failed(nearbyEvents);
    }

    return success({ events: transformEvents(nearbyEvents) });
  });
};
