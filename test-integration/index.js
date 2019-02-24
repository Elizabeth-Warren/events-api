const STAGE_ROUTE = process.env.STAGE_ROUTE;
const EVENTS_ROUTE = `${STAGE_ROUTE}-events`;

const assert = require('assert').strict;
const request = require('request-promise-native');

async function test() {
  try {
    const upcomingEventsResponse = await request(`${EVENTS_ROUTE}/upcoming`);
    assert.strictEqual(upcomingEventsResponse.statusCode, 200);

    const { events: upcomingEvents } = await upcomingEventsResponse.json();
    assert.strictEqual(Array.isArray(upcomingEvents), true);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

test();
