const asyncWrap = require('../utils/asyncWrap');
const geolib = require('geolib');

/**
 * Model Attributes
 *
 * @param  {String} _id Message id
 * @param  {String} text The message content
 * @param  {String} slackArchiveUrl A deep link to the slack message
 * @param  {String} threadId Id of the Slack thread this conversation relates to
 * @param  {String} channelId Id of the Slack channel this conversation relates to
 * @param  {String} conversationId The supporters phone number
 * @param  {String} from The phone number of who sent the message
 * @param  {String} to The phone number the message was sent to
 * @param  {String|null} slackUser If the message was sent from Slack, this is their user id
 * @param  {String|null} slackChannel If the message was sent from Slack, this is the channel id
 * @param  {Date} createdAt The date at which this message was created
 *
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
 */

module.exports = (db) => {
  const collection = db.collection('events');
  const searchRadius = 300 * 1609;  // 300 miles in meters

  async function _init() {
    await collection.createIndex({ startTime: 1 });
    await collection.createIndex({ loc: '2dsphere' });
  }

  const init = asyncWrap(_init);

  /**
   * Get a list of events that haven't hapended yet,
   * sorted by how close they are to happening.
   *
   * @return      {Array<Object>}
   */
  async function _getUpcomingEvents() {
    const eventsCursor = await collection.find().sort( { startTime: 1 } );
    return await eventsCursor.toArray();
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
    return await eventsCursor.toArray();
  }

  const getEventsNearPoint = asyncWrap(_getEventsNearPoint);

  return {
    init,
    getUpcomingEvents,
    getEventsNearPoint,
  };
};
