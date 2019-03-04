// TODO: Can we delete this since we're no longer concerned about having to store sensitive information here?

/**
 * Ensure only public information fields are returned in the API response.
 *
 * @param  {Array}  [events=[]]
 * @return {Array}
 */
function transformEvents(events = []) {
  if (! events || ! events.length) {
    return [];
  }

  return events.map(({
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
    rsvpCtaOverride,
  }) => ({
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
    rsvpCtaOverride,
  }));
}

module.exports = transformEvents;
