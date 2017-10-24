/*
 * This script assumes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported as environment variables
 */
const AWS = require('aws-sdk');
const fs = require('fs');
const request = require('request');
const isProduction = process.env.NODE_ENV === 'production';
const outputFile = 'meetup-data.json';
const meetups = [
  'Prov-JS',
  'Kenzan-Providence-Hack-Nights',
  'Girl-Develop-It-Providence',
  'Tech-Collective-Meetups',
  'MojoTech-Meetups',
  'Rhode-Island-Makers-Microcontrollers-Robotics-Meetup',
  'ux-meetup',
  'IntraCityGeeks',
  'WordPressRI'
];

(function init() {
  const promises = meetups.map(meetup => getMeetupEventsData(`https://api.meetup.com/${meetup}/events`));
  const resolveAllPromises = isProduction ? resolveMeetupEventsDataS3 : resolveMeetupEventsDataLocal;

  Promise.all(promises)
    .then(resolveAllPromises)
    .catch(handleError);
})();

function resolveMeetupEventsDataLocal(results) {
  const outputPath = `./output/${outputFile}`;

  fs.writeFileSync(outputPath, formatResults(results));

  console.log(`Successfully output data to ${outputPath}`); // eslint-disable-line
}

function resolveMeetupEventsDataS3(results) {
  const s3 = new AWS.S3();
  const bucket = 'providencegeeks.com';
  const key = `external-services-data/meetup/${outputFile}`;

  s3.createBucket({ Bucket: bucket }, function(err) {

    if (err) {
      handleError(err);
    } else {
      const params = {
        Bucket: bucket,
        Key: key,
        Body: formatResults(results),
        ACL: 'public-read'
      };

      s3.putObject(params, function(err) {
        if (err) {
          handleError(err);
        } else {
          console.log(`Successfully uploaded data to ${bucket}/${key}`); // eslint-disable-line
        }
      });
    }
  });
}

function getMeetupEventsData(url) {
  return new Promise(function(resolve, reject) {

    request({
      method: 'GET',
      uri: url
    }, function (error, response, body) {
      if (error) {
        reject(error);
      }
      resolve(JSON.parse(body));
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