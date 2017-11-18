/*
 * This script assumes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported as environment variables
 */
const archiver = require('archiver');
const AWS = require('aws-sdk');
const fs = require('fs');
const packageJson = require('./package.json');
const s3Bucket = 'lambda.pvdgeeks.org';
const s3Key = `meetup-${packageJson.version}.zip`;
const zipOutput = `./archive/${s3Key}`;

// creating a zip is async, and we are passing release as an "anDone" callback function
archiveRelease(release);

function archiveRelease(onDone) {

  // prep output directory
  fs.mkdirSync('./archive');

  const output = fs.createWriteStream(zipOutput);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('finish', function() {
    console.log('zip made, release it!'); // eslint-disable-line
    onDone();
  });

  archive.on('error', function(err) {
    throw err;
  });

  archive.pipe(output);
  archive.file('./src/index.js', { name: 'index.js' });
  archive.finalize();
}

function release() {
  const s3 = new AWS.S3();
  const upload = fs.readFileSync(zipOutput);

  s3.createBucket({ Bucket: s3Bucket }, function(error) {

    if (error) {
      console.log(`ERROR: ${error}.  Should probably log this somewhere`); // eslint-disable-line
    } else {
      const params = {
        Bucket: s3Bucket,
        Key: s3Key,
        Body: upload,
        ACL: 'public-read'
      };

      s3.putObject(params, function(error) {
        if (error) {
          console.log(`ERROR: ${error}.  Should probably log this somewhere`); // eslint-disable-line
        } else {
          console.log(`Successfully uploaded data to ${s3Bucket}/${s3Key}`); // eslint-disable-line
        }
      });
    }
  });
}