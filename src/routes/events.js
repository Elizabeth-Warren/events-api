const { HttpError } = require('@ewarren/serverless-routing');
const EventS3Model = require('../models/EventS3');
const EventModel = require('../models/Event');
const transformEvents = require('../transformers/event');

module.exports = ({ app, s3, connectToDatabase }) => {
  app.get('/upcoming', async ({ success, failed, event }) => {
    const { queryStringParameters } = event;
    const {
      v2 = false,
    } = (queryStringParameters || {});

    var upcomingEvents;
    if (v2) {
      const db = await connectToDatabase();
      const Event = EventModel(db);
      upcomingEvents = await Event.getUpcomingEvents();
    } else {
      const EventS3 = EventS3Model(s3);
      upcomingEvents = await EventS3.getUpcomingEvents();
    }

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
      v2 = false,
    } = (queryStringParameters || {});

    const formattedLat = parseFloat(lat);
    const formattedLon = parseFloat(lon);

    if (isNaN(formattedLat) || isNaN(formattedLon)) {
      return failed(new HttpError('Missing lat/lon.'), 400);
    }

    const EventS3 = EventS3Model(s3);
    const nearbyEvents = await EventS3.getEventsNearPoint(formattedLon, formattedLat);

    if (nearbyEvents instanceof HttpError) {
      return failed(nearbyEvents);
    }

    return success({ events: transformEvents(nearbyEvents) });
  });
};
