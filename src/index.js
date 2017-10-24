const AWS = require('aws-sdk');
const fs = require('fs');
const request = require('request');
const isProduction = process.env.NODE_ENV === 'production';
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

// When a meetup has no events, it returns an empty array.
// we should probably create a hash map, e.g.
/* {
 *   "Prov-JS": [{
 *     // array of events
 *     }, {
 *
 *   }],
 *   "Kenzan-Providence-Hack-Nights": [{
 *      //etc
 *   }]
 */

function formatResults(results) {
  return JSON.stringify(results, null, 2)
}

function resolveMeetupEventsDataLocal(results) {
  fs.writeFile('./output/meetup-data.json', formatResults(results));
}

function resolveMeetupEventsDataProduction(results) {
  const s3 = new AWS.S3();
  const bucket = 'providencegeeks.com';
  const key = 'external-services-data/meetup/meetup-data.json';

  s3.createBucket({Bucket: bucket}, function(err, data) {

    if (err) {
      console.log(err);
    } else {
      const params = {
        Bucket: bucket,
        Key: key,
        Body: formatResults(results),
        ACL: 'public-read'
      };

      s3.putObject(params, function(err, data) {
        if (err) {
          console.error(err)
        } else {
          console.log(`Successfully uploaded data to ${bucket}/${key}`);
        }
      });

    }
  });
}

function getMeetupEventsData(url) {
  return new Promise(function(resolve, reject) {

    request({ method: 'GET',
        uri: url
      }, function (error, response, body) {
        if (error) {
          reject(error);
        }
        resolve(JSON.parse(body));
      }
    );
  });

}

function init() {
  const promises = meetups.map(meetup => getMeetupEventsData(`https://api.meetup.com/${meetup}/events`));
  const promiseResolver = isProduction ? resolveMeetupEventsDataProduction : resolveMeetupEventsDataLocal;

  Promise.all(promises)
    .then(promiseResolver)
    .catch((err) => {
      console.error(`ERROR: ${err}.  Should probably log this somewhere?`);
    });
}

init();