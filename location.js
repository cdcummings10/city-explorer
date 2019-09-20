'use strict';

require('dotenv').config();
const DATABASE_URL = process.env.DATABASE_URL;
const superagent = require('superagent');
const pg = require('pg');
const client = new pg.Client(DATABASE_URL);

const errorHandler = require('./error')

function Locations (searchQuery, geoDataResults) {
  this.searchQuery = searchQuery.toLowerCase();
  this.formattedQuery = geoDataResults.formatted_address;
  this.latitude = geoDataResults.geometry.location.lat;
  this.longitude = geoDataResults.geometry.location.lng;
  // lat = this.latitude;
  // lng = this.longitude;
}

function checkNewLocation(request, response) {
  let searchQuery = request.query.data;
  let sqlQuery = `SELECT * FROM locations WHERE search_query='${searchQuery}';`
  client.query(sqlQuery)
    .then(queryResult => {
      if (queryResult.rowCount > 0){
        console.log('In database, sending row 1');
        response.send(queryResult.rows[0])
      }
      else {
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`
        superagentGetLocation(url, searchQuery, response);
      }
      //send to front end
    })
    .catch(err => errorHandler(err, response));
}

function superagentGetLocation(url, searchQuery, response){
  superagent.get(url)
    .then(superagentResults => {
      let locations = newLocation(superagentResults, searchQuery)
      sendSQLLocation(searchQuery, locations);
      //send to database
      response.send(locations);
    })
}
function newLocation(superagentResults, searchQuery){
  let results = superagentResults.body.results[0];
  let locations = new Locations(searchQuery, results);
  return locations;
}

function sendSQLLocation(searchQuery, locations){
  let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);'
  let values = [searchQuery, locations.formattedQuery, locations.latitude, locations.longitude];
  client.query(sql, values)
    .then(pgResults => {
      console.log('Asking Google, sending data to database');
    })
    .catch(error => errorHandler(error));
}

module.exports = checkNewLocation;
