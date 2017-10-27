/*
 * This script assumes AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are exported as environment variables
 */
const archiver = require('archiver');
const AWS = require('aws-sdk');
const fs = require('fs');
const zipOutput = './archive/meetup.zip';

archiveRelease(release);

function archiveRelease(onEnd) {

  // prepout directory
  fs.mkdirSync('./archive');

  const output = fs.createWriteStream(zipOutput);
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });


  output.on('finish', function() {
    console.log('zip made, release it!'); // eslint-disable-line
    onEnd();
  });

  archive.on('error', function(err) {
    throw err;
  });

  // pipe archive data to the file
  archive.pipe(output);

  // append a file
  archive.file('./src/index.js', { name: 'index.js' });

  // finalize the archive (ie we are done appending files but streams have to finish yet)
  // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
  archive.finalize();
}

function release() {
  const s3 = new AWS.S3();
  const bucket = 'providencegeeks.com';
  const key = 'lambda/meetup.zip';
  const upload = fs.readFileSync(zipOutput);

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
}