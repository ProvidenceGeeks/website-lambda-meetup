/*
 * This script assumes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported as environment variables
 */
// const request = require('request');
// const isProduction = process.env.NODE_ENV === 'production';
// const outputFile = 'meetup-data.json';
const AWS = require('aws-sdk');
const fs = require('fs');

(function release() {
  const s3 = new AWS.S3();
  const bucket = 'providencegeeks.com';
  const key = 'lambda/meetup.js';
  const upload = fs.readFileSync('./src/index.js');

  s3.createBucket({ Bucket: bucket }, function(err) {

    if (err) {
      handleError(err);
    } else {
      const params = {
        Bucket: bucket,
        Key: key,
        Body: upload,
        ACL: 'public-read'
      };

      s3.putObject(params, function(err) {
        if (err) {
          console.log(`ERROR: ${error}.  Should probably log this somewhere`); // eslint-disable-line
        } else {
          console.log(`Successfully uploaded data to ${bucket}/${key}`); // eslint-disable-line
        }
      });
    }
  });
})();