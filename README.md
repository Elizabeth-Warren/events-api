# events-api

Lookup nearby campaign events.

## Local Development

Requires Docker.

```sh
$ make tests
```

## Deployment

Use the [serverless toolbox](https://github.com/Elizabeth-Warren/serverless-toolbox),

```sh
# From the `serverless-toolbox` directory,
$ SRC=~/dev/events-api make toolbox # Replace ~/dev/events-api with the path
                                    # to the `events-api` on your host machine.

$ sls deploy function -f api # Use `sls deploy` if you make any changes beyond code.
$ sls logs -f api
```

## Endpoints

**Get Upcoming Events**

Return a list of sorted events.

```
GET /events/upcoming

Response (200/json)
{
  events: [
    {
      title: String,
      date: String,
      startTime: String,
      endTime: String,
      timezone: String,
      publicAddress: String,
      city: String,
      state: String,
      zipcode: String,
      latitude: String,
      longitude: String,
      rsvpLink: String,
    },
  ],
}
```

**Get Nearby Events**

Get events near a given lat/lon coordinate within 300 miles.

```
GET /nearby?lat=${LATITUDE}&lon=${LONGITUDE}

Response (200/json)
{
  events: [
    {
      distance: Float, // Miles from request coordinate
      title: String,
      date: String,
      startTime: String,
      endTime: String,
      timezone: String,
      publicAddress: String,
      city: String,
      state: String,
      zipcode: String,
      latitude: String,
      longitude: String,
      rsvpLink: String,
    },
  ],
}
```

### Endpoint Errors

**AWS API Gateway Errors**

```
{
  "message": String,
}
```

**Events API Errors**

```
{
  error: {
    message: String,
  },
}
```
