const https = require('https');
const request = require('request-promise-native');
const { mobilizeAmericaToMongoDocument } = require('../transformers/event');
const { setupDatabase } = require('../utils/connectToDatabase');

function promotedOrganizationsUrl() {
  return 'https://api.mobilize.us/v1/organizations/1316/promoted_organizations';
}

function organizationEventsUrl(organizationId) {
  return `https://api.mobilize.us/v1/organizations/${organizationId}/events?timeslot_start=gte_now`;
}

const mobilizeAmericaApiKey = process.env.MOBILIZE_AMERICA_API_KEY;
const upsertBatchSize = 10;

async function mobilizeAmericaRequest(url) {
  return request({
    url,
    json: true,
    headers: {
      Authorization: `Bearer ${mobilizeAmericaApiKey}`,
    },
  });
}

async function getPromotedOrganizations() {
  const body = await mobilizeAmericaRequest(promotedOrganizationsUrl());
  const organizationIds = body.data.map(({ id }) => id);
  return organizationIds;
}

async function getEventsForOrganization(organizationId) {
  let results = []
  let nextUrl = organizationEventsUrl(organizationId);
  while (nextUrl) {
    body = await mobilizeAmericaRequest(nextUrl);
    nextUrl = body.next;
    results.push(...body.data);
  }
  return results;
}

async function getAllEvents() {
  const promotedOrganizationIds = await getPromotedOrganizations();
  return Promise.all(
    promotedOrganizationIds.map(
      organizationId => getEventsForOrganization(organizationId)
    )
  ).then(nestedEvents => {
    let flatEvents = [];
    for (let organizationEvents of nestedEvents) {
      flatEvents.push(...organizationEvents);
    }
    console.log('There are', flatEvents.length, 'events across', promotedOrganizationIds.length, 'orgs.');
    return flatEvents;
  });
}

async function deleteAllBut(events, collection) {
  const eventIds = events.map(({ mobilizeId }) => mobilizeId);
  return collection.deleteMany({
    mobilizeId: {
      $ne: null,
      $nin: eventIds,
    },
  });
} 

function batchArray(array, batchSize) {
  return Array.from(
    { length: Math.ceil(array.length / batchSize) },
    (_, index) => array.slice(index * batchSize, (index + 1) * batchSize)
  );
}

async function upsertBatch(batch, collection) {
  const bulk = await collection.initializeUnorderedBulkOp();
  for (let e of batch) {
    await bulk.find({ mobilizeId: e.mobilizeId }).upsert().updateOne(e);
  }
  return bulk.execute();
}

/**
 * Replaces all Mobilize America event documents in 'collection' with those in 'documents'.
 *
 * First deletes all documents in the collection which have a mobilizeId and
 * whose mobilizeId is not in 'documents'. Then upserts each document in
 * 'documents' based on its mobilizeId.
 */
async function replaceEventsInCollection(documents, collection) {
  await deleteAllBut(documents, collection);
  const batches = batchArray(documents, upsertBatchSize);
  for (batch of batches) {
    await upsertBatch(batch, collection);
  }
}

const importEvents = async function() {
  console.log('Starting importEvents()');
  const db = await setupDatabase();
  console.log('Fetching events from Mobilize America...');
  const events = await getAllEvents();
  const documents = events.map(mobilizeAmericaToMongoDocument);
  console.log('Upserting events into mongodb...');
  await replaceEventsInCollection(documents, db.collection('events'));
  console.log('Done. importEvents() finished.');
}

module.exports = importEvents;
