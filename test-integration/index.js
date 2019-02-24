const STAGE_ROUTE = process.env.STAGE_ROUTE;
const EVENTS_ROUTE = `${STAGE_ROUTE}-events`;

const assert = require('assert');
const request = require('request-promise-native');

async function test() {
  try {
    const response = await request(`${EVENTS_ROUTE}/upcoming`);
    console.log(response);
    // assert.equal(Array.isArray(response.events), true);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

test();
