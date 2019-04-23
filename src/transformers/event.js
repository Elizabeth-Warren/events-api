/**
 * Map event as stored in mongodb events table into the API response.
 *
 * @param  {Array}  document from events collection
 * @return {Array}  event suitable for API response
 */
function transformEvents(events = []) {
  if (! events || ! events.length) {
    return [];
  }

  function iso(input) {
    return input ? new Date(input).toISOString() : null;
  }

  return events.map(({
    loc,
    title,
    date,
    startTime,
    endTime,
    timezone,
    publicAddress,
    city,
    state,
    zipcode,
    latitude,
    longitude,
    rsvpLink,
    rsvpCtaOverride
  }) => ({
    title,
    date: iso(date),
    startTime,
    endTime,
    timezone,
    publicAddress,
    city,
    state,
    zipcode,
    longitude: loc ? loc.coordinates[0] : null,
    latitude: loc ? loc.coordinates[1] : null,
    rsvpLink,
    rsvpCtaOverride,
  }));
}

module.exports = transformEvents;
