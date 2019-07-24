/*
 * This script assumes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported as environment variables
 */
const AWS = require('aws-sdk');
const fs = require('fs');
const https = require('https');
const isProduction = process.env.NODE_ENV === 'production';
const meetups = [
  'Prov-JS',
  'CloudRI',
  'Girl-Develop-It-Providence',
  'MojoTech-Meetups',
  'Rhode-Island-Makers-Microcontrollers-Robotics-Meetup',
  'ux-meetup',
  'IntraCityGeeks',
  'WordPressRI',
  'Providence-Geeks',
  'RIVirtualReality'
];
const outputFile = 'meetup-data.json';
const s3Config = {
  bucket: 'data.pvdgeeks.org',
  key: 'meetup'
};

// expose handler for Lambda
exports.run = run;

if (!isProduction) {
  run();
}

function run() {
  const resolveAllPromises = isProduction ? resolveMeetupEventsDataS3 : resolveMeetupEventsDataLocal;
  const eventsData = getMeeptupEventsData();
  const groupsData = getMeeptupGroupsData();

  Promise.all([eventsData, groupsData])
    .then(function (results) {
      let events = JSON.parse(formatResults(results[0]));
      let groups = results[1];
      let groupImages = {};

      // Build object containing group name, and associated group image.
      groups.map(group => {
        groupImages[group.urlname] = group.group_photo !== undefined ? group.group_photo.photo_link : null;
      });

      // Append this image to event
      events.map(event => {
        event.group.group_photo = groupImages[event.group.urlname]; // eslint-disable-line camelcase
      });

      resolveAllPromises(events);
    })
    .catch(handleError);
}

function resolveMeetupEventsDataLocal(results) {
  const outputBase = './output';
  const outputPath = `${outputBase}/${outputFile}`;

  fs.mkdirSync(outputBase);
  fs.writeFileSync(outputPath, formatResults(results));

  console.log(`Successfully output data to ${outputPath}`); // eslint-disable-line
}

function resolveMeetupEventsDataS3(results) {
  const s3 = new AWS.S3();
  const key = `${s3Config.key}/${outputFile}`;

  s3.createBucket({ Bucket: s3Config.bucket }, function(err) {

    if (err) {
      handleError(err);
    } else {
      const params = {
        Bucket: s3Config.bucket,
        Key: key,
        Body: formatResults(results),
        ACL: 'public-read'
      };

      s3.putObject(params, function(err) {
        if (err) {
          handleError(err);
        } else {
          console.log(`Successfully uploaded data to ${s3Config.bucket}/${key}`); // eslint-disable-line
        }
      });
    }
  });
}

function getMeeptupEventsData() {
  const promises = meetups.map(meetup => getData(`https://api.meetup.com/${meetup}/events`));

  return Promise.all(promises)
    .then(function (results) {
      const validEvents = results.filter((event) => {
        if (!event.errors) {
          return event;
        }
      });

      return validEvents;
    })
    .catch(handleError);
}

function getMeeptupGroupsData() {
  const promises = meetups.map(meetup => getData(`https://api.meetup.com/${meetup}`));

  return Promise.all(promises)
    .then(function (results) {
      const activeGroups = results.filter((group) => {
        if (!group.errors) {
          return group;
        }
      });

      return activeGroups;
    })
    .catch(handleError);
}

function getData(url) {
  return new Promise(function(resolve, reject) {

    https.get(url, (resp) => {
      let data = '';

      // A chunk of data has been recieved.
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // The whole response has been received. Print out the result.
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });

    }).on('error', (err) => {
      reject(() => handleError(err));
    });
  });
}

function formatResults(results) {
  results = [].concat.apply([], results);

  return JSON.stringify(results, null, 2);
}

function handleError(error) {
  console.log(`ERROR: ${error}.  Should probably log this somewhere`); // eslint-disable-line
}
