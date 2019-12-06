//this file will contain most of the logic for fetching the data from each API endpoint

const request = require('request');

/**
 * Makes a single API request to retrieve the user's IP address.
 * Input:
 *   - A callback (to pass back an error or the IP string)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The IP address as a string (null if error). Example: "162.245.144.188"
 */
const fetchMyIP = function(callback) {
  // use request to fetch IP address from JSON API

  const URL = 'https://api.ipify.org/?format=json';
  request(URL, (error, response, body) => {
    //error can be set if invalid domain, user is offline, etc.
    if (error) {
      callback(error, null);
      return;
    }

    //if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching IP. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }
    
    const ip = JSON.parse(body).ip;
    callback(error, ip);
    
  });

};


/**
 * Makes a single API request to retrieve the user's geo coordinates from the IP address.
 * Input:
 *   - ip address
 *   - A callback (to pass back an error or the coordinates)
 * Returns (via Callback):
 *   - geo coordinates
 *   - error
 */
const fetchCoordsByIP = function(ip, callback) {

  const URL = `https://ipvigilante.com/${ip}`;

  request(URL, (error, response, body) => {
    //error can be set if invalid domain, user is offline, etc.
    if (error) {
      callback(error, null);
      return;
    }

    //if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching coordinates for ${ip}. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }
    
    const coords = {};
    coords.latitude = JSON.parse(body).data.latitude;
    coords.longitude = JSON.parse(body).data.longitude;
    callback(error, coords);
    
  });

};

/**
 * Makes a single API request to retrieve upcoming ISS fly over times the for the given lat/lng coordinates.
 * Input:
 *   - An object with keys `latitude` and `longitude`
 *   - A callback (to pass back an error or the array of resulting data)
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly over times as an array of objects (null if error). Example:
 *     [ { risetime: 134564234, duration: 600 }, ... ]
 */
const fetchISSFlyOverTimes = function(coords, callback) {
  
  const URL = `http://api.open-notify.org/iss-pass.json?lat=${coords.latitude}&lon=${coords.longitude}`;

  request(URL, (error, response, body) => {
    //error can be set if invalid domain, user is offline, etc.
    if (error) {
      callback(error, null);
      return;
    }

    //if non-200 status, assume server error
    if (response.statusCode !== 200) {
      const msg = `Status Code ${response.statusCode} when fetching times for ${coords}. Response: ${body}`;
      callback(Error(msg), null);
      return;
    }
    
    const times = JSON.parse(body).response;
    callback(error, times);
    
  });



};

/**
 * Orchestrates multiple API requests in order to determine the next 5 upcoming ISS fly overs for the user's current location.
 * Input:
 *   - A callback with an error or results.
 * Returns (via Callback):
 *   - An error, if any (nullable)
 *   - The fly-over times as an array (null if error):
 *     [ { risetime: <number>, duration: <number> }, ... ]
 */
const nextISSTimesForMyLocation = function(callback) {
  
  fetchMyIP((error, ip) => {
    if (error) {
      callback(error, null);
    } else {
      fetchCoordsByIP(ip, (error, coords) => {
        if (error) {
          callback(error, null)
        } else { 
          fetchISSFlyOverTimes(coords, (error, times) => {
            if (error) {
              callback(error, null)
            } else {
              callback(null, times);
            }
          })
        }
      })
    }
  });






};




module.exports = { nextISSTimesForMyLocation };