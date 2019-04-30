const asyncWrap = require('../utils/asyncWrap');

/**
 * Represents an event, a la Mobilize America or a BSD event.
 *
 * Pulls events from mongodb, where an example document is like:
 *   {
 *     loc: { type: 'Point', coordinates: [-93.8549133, 41.6157869] },
 *     title: {
 *       'en-US': 'Waukee for Warren Coffee Hours',
 *       'es-MX': 'Waukee for Warren Coffee Hours',
 *     },
 *     published: true,
 *     date: new Date(1556114400),
 *     startTime: new Date(1556114400),  // April 24, 2019 10:00 AM EDT
 *     endTime: new Date(1556125200),
 *     timezone: 'America/Chicago',
 *     publicAddress: '1025 E Hickman Rd, Waukee IA 50263',
 *     city: 'Waukee',
 *     state: 'IA',
 *     zipcode: '50263',
 *     rsvpLink: 'https://events.elizabethwarren.com/event/88773/',
 *     rsvpCtaOverride: null,
 * }
 *
 * Returns list of event objects in that format.
 */

module.exports = (db) => {
  const collection = db.collection('events');
  const searchRadius = 300 * 1609;  // 300 miles in meters

  async function _init() {
    await collection.createIndex([ { startTime: 1 }, { highPriority: -1 }]);
    await collection.createIndex({ mobilizeId: 1 });
    await collection.createIndex([{ loc: '2dsphere' }, { highPriority: -1 }]);
  }

  const init = asyncWrap(_init);

  /**
   * Get a list of events that haven't happened yet,
   * ordered by how soon they will happen.
   *
   * @return      {Array<Object>}
   */
  async function _getUpcomingEvents() {
    const eventsCursor = await collection.find({
      startTime: {
        $gte : new Date(),
      }
    }).sort({ highPriority: -1, startTime: 1 });
    return eventsCursor.toArray();
  }

  const getUpcomingEvents = asyncWrap(_getUpcomingEvents);

  /**
   * Get events near a point within 300 miles, ordered by proximity.
   *
   * @param       {Number} originLon
   * @param       {Number} originLat
   * @return      {Array<Object>}
   */
  async function _getEventsNearPoint(originLon, originLat) {
    const eventsCursor = await collection.find({
      loc: {
        $near: {
          $geometry: {
            type: 'Point' ,
            coordinates: [ originLon, originLat ]
          },
          $maxDistance: searchRadius
        }
      }
    })
    return eventsCursor.toArray();
  }

  const getEventsNearPoint = asyncWrap(_getEventsNearPoint);

  return {
    init,
    getUpcomingEvents,
    getEventsNearPoint,
  };
};
