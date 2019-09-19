'use strict'

const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
app.use(cors());

const PORT = process.env.PORT || 3000;

//connect database
const client = new pg.Client(DATABASE_URL);

client.on('error', errorHandler);

let lat = 0;
let lng = 0;



function Locations (searchQuery, geoDataResults) {
  this.searchQuery = searchQuery.toLowerCase();
  this.formattedQuery = geoDataResults.formatted_address;
  this.latitude = geoDataResults.geometry.location.lat;
  this.longitude = geoDataResults.geometry.location.lng;
  lat = this.latitude;
  lng = this.longitude;
}


function Weather (searchQuery, weatherDataResults) {
  //   this.searchQuery = searchQuery;
  this.forecast = weatherDataResults.summary;
  this.time = new Date(weatherDataResults.time * 1000).toDateString();
}

function Events(eventData) {
  this.link = eventData.url;
  this.name = eventData.name.text;
  this.event_date = new Date(eventData.start.local).toDateString();
  this.summary = eventData.summary;

}
function errorHandler(err, response){
  console.error(err);
  const errorObj = {
    status: 500,
    text: 'An error with the database has occurred. Please try again.'
  }
  response.status(errorObj.status).send(errorObj);
}

app.get('/location', (request, response) => {
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
        superagent.get(url)
          .then(superagentResults => {
            let results = superagentResults.body.results[0];
            let locations = new Locations(searchQuery, results);
            //send to database
            let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);'
            let values = [searchQuery, locations.formattedQuery, lat, lng];
            client.query(sql, values)
              .then(pgResults => {
                console.log('Asking Google, sending data to database');
              })
              .catch(error => errorHandler(error));
            response.send(locations);
          })
      }
      //send to front end
    })
    .catch(err => errorHandler(err, response));
})

app.get('/weather', (request, response) => {
  let searchQuery = request.query.data;
  let url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${lat},${lng}`
  superagent.get(url)
    .then(superagentResults => {
      const weatherDataResults = superagentResults.body;
      let weatherArray = weatherDataResults.daily.data.map(day => {
        const weather = new Weather(searchQuery, day);
        return weather;
      })

      response.status(200).send(weatherArray);
    })
    .catch(err =>{
      errorHandler(err, response);
    })
})

app.get('/events', (request, response) => {
  let url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${lng}&location.latitude=${lat}&expand=venue&token=${process.env.EVENT_API_KEY}`
  superagent.get(url)
    .then(superagentResults => {
      const eventResults = superagentResults.body;
      const eventsArray = eventResults.events.slice(0,10).map(event => {
        let theEvent = new Events (event);
        return theEvent;
      })
      response.status(200).send(eventsArray);
    })
    .catch(err =>{
      errorHandler(err, response);
    })
})

app.use('*', (request, response) => response.status(404).send('Location does not exist pal'));


client.connect()
  .then(()=>{
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch(error => errorHandler(error));
