const { HttpError } = require('@ewarren/serverless-routing');
const kdbush = require('kdbush');
const geokdbush = require('@itsjoekent/geokdbush');
const asyncWrap = require('../utils/asyncWrap');
const eventTime = require('../utils/eventTime');

const EVENTS_BUCKET = process.env.EVENTS_BUCKET;
const EVENTS_FILE = process.env.EVENTS_FILE;

module.exports = (s3) => {
  /**
   * Fetch and parse events from the flatfile.
   *
   * @return {Array<Object>|HttpError}
   */
  async function _loadEvents() {
    const params = {
      Bucket: EVENTS_BUCKET,
      Key: EVENTS_FILE,
    };

    const data = await s3.getObject(params).promise();

    if (! data) {
      return new HttpError('Failed to load data.');
    }

    const { data: events } = JSON.parse(JSON.parse(data.Body.toString()));

    if (! events || ! events.length) {
      return new HttpError('Failed to load event data.');
    }

    const formattedEvents = events.map((event) => ({
      title: {
        'en-US': event['Event Title (US-EN)'],
        'es-MX': event['Event Title (ES-MX)'],
      },
      isPublished: event.Published,
      date: event.Date,
      startTime: event['Start Time'],
      endTime: event['End Time'],
      timezone: event.Timezone,
      publicAddress: event['Public Address'],
      city: event.City,
      state: event.State,
      zipcode: event.Zipcode,
      latitude: event.Latitude,
      longitude: event.Longitude,
      rsvpLink: event['RSVP Link'],
      rsvpCtaOverride: event['RSVP CTA'],
    }));

    const publishedEvents = formattedEvents.filter(({ isPublished }) => isPublished);

    // TODO: We should make this smarter.
    const openEvents = publishedEvents.filter(({ date }) => eventTime(date, true) > Date.now());

    return openEvents;
  }

  const loadEvents = asyncWrap(_loadEvents);

  /**
   * Get a list of events that haven't hapended yet,
   * sorted by how close they are to happening.
   *
   * @return      {Array<Object>}
   */
  async function _getUpcomingEvents() {
    const events = await loadEvents();

    if (events instanceof HttpError) {
      return events;
    }

    const sorted = events.sort(({ date: a }, { date: b }) => (
      eventTime(a) - eventTime(b)
    ));

    return sorted;
  }

  const getUpcomingEvents = asyncWrap(_getUpcomingEvents);

  /**
   * Get events near a point within 300 miles.
   *
   * @param       {Number} originLon
   * @param       {Number} originLat
   * @return      {Array<Object>}
   */
  async function _getEventsNearPoint(originLon, originLat) {
    const events = await loadEvents();

    if (events instanceof HttpError) {
      return events;
    }

    const locationEvents = events.filter(event => !! event.longitude && !! event.latitude);

    const index = new kdbush(
      locationEvents,
      ({ longitude }) => longitude,
      ({ latitude }) => latitude,
    );

    const maxDistance = 482.803; // 300 miles in Kilometers
    const nearestPoints = geokdbush.around(index, originLon, originLat, Infinity, maxDistance, undefined, 'distance');

    const nearestEventsInMiles = nearestPoints.map((event) => ({
      ...event,
      distance: event.distance / 1.6,
    }));

    return nearestEventsInMiles;
  }

  const getEventsNearPoint = asyncWrap(_getEventsNearPoint);

  return {
    getUpcomingEvents,
    getEventsNearPoint,
  };
};
