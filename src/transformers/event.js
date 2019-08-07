/**
 * Map an event as stored in mongodb events table into the API response.
 *
 * @param  {Array}  document from events collection
 * @return {Array}  event suitable for API response
 */

function iso(input) {
  return input ? new Date(input).toISOString() : null;
}

function mongoDocumentToResponse({
  title,
  startTime,
  endTime,
  timezone,
  venue,
  publicAddress,
  city,
  state,
  zipcode,
  loc,
  latitude,
  longitude,
  highPriority,
  rsvpLink,
  rsvpCtaOverride,
  eventType,
}) {
  return {
    title,
    date: iso(startTime),
    startTime,
    endTime,
    timezone,
    venue,
    publicAddress,
    city,
    state,
    zipcode,
    longitude: loc ? loc.coordinates[0] : null,
    latitude: loc ? loc.coordinates[1] : null,
    highPriority,
    rsvpLink,
    rsvpCtaOverride,
    eventType,
  };
};

function mobilizeAmericaToMongoDocument({
  id,
  timeslots,
  title,
  location,
  timezone,
  browser_url,
  high_priority,
  event_type,
}) {
  return {
    mobilizeId: id,
    loc: location && location.location && location.location.longitude && location.location.latitude ? {
      type: 'Point',
      coordinates: [
        location.location.longitude,
        location.location.latitude,
      ],
    } : null,
    title: {
      'en-US': title,
      'es-MX': title,
    },
    published: true,
    startTime: new Date(timeslots[0].start_date * 1000),
    endTime: new Date(timeslots[0].end_date * 1000),
    timezone,
    venue: location ? location.venue : '',
    publicAddress: location && location.address_lines ? location.address_lines[0] : '',
    city: location ? location.locality : '',
    state: location ? location.region : '',
    zipcode: location ? location.postal_code : '',
    rsvpLink: browser_url.replace(new RegExp('www.mobilize.us/[^/]+'), 'events.elizabethwarren.com'),
    rsvpCtaOverride: null,
    highPriority: high_priority,
    eventType: event_type,
  };
};


module.exports = {
  mongoDocumentToResponse,
  mobilizeAmericaToMongoDocument,
};
