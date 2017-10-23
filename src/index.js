var fs;
var promises;
var request;

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

request = require('request');
fs = require('fs');

function getData(url) {
  return new Promise(function(resolve, reject) {

    request(
      { method: 'GET',
        uri: url
      }
      , function (error, response, body) {

        if (error) {
          reject(error);
        }
        resolve(JSON.parse(body));
      }
    );
  });

}

function init() {
  promises = meetups.map(meetup => getData(`https://api.meetup.com/${meetup}/events`));

  Promise.all(promises)
    .then(results => {
      fs.writeFile('meetup-data.json', JSON.stringify(results, null, 2));
    });
}

init();