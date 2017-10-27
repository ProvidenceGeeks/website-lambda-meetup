# website-lambda-meetup

## Overview
Repository for Lambda functionality related to periodically fetching data from the meetup.com API.  Built in Node.js

## Project Setup

Please review the local development environment [steps](https://github.com/ProvidenceGeeks/website-docs/wiki/Onboarding-Guide#lambda) before getting started.

1. Import the project in your IDE.
2. In order to run the application (e.g. fetch Meetup data), run `yarn run fetch`

## Development
To test locally, run
```
yarn run fetch
```

To test against S3, `export` _AWS_ACCESS_KEY_ID_ and _AWS_SECRET_ACCESS_KEY_ and run
```
export NODE_ENV=production && yarn run fetch
```

All available tasks are in the *scripts* section of *package.json*.

## Release Management
// TODO remove the need for step 2?
1. This project automatically deploys this Lambda to S3 as a zip on every merge into master.
1. Update the Lambda by uploading the uploaded using this [S3 path](https://s3.amazonaws.com/providencegeeks.com/lambda/meetup.zip)
