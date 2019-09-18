'use strict'

const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const cors = require('cors');
const superagent = require('superagent');
app.use(cors());

const PORT = process.env.PORT || 3000;

let lat = 0;
let lng = 0;

app.listen(PORT, () => console.log(`listening on ${PORT}`));

function Locations (searchQuery, geoDataResults) {
  this.searchQuery = searchQuery;
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
  console.log(this);
}

function Events(eventData) {
  this.link = eventData.url;
  this.name = eventData.name.text;
  this.event_date = new Date(eventData.start.local).toDateString();
  console.log(eventData.start);
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
  let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`
  superagent.get(url)
    .then(superagentResults => {
      console.log(superagentResults.body.results[0]);
      let results = superagentResults.body.results[0];
      let locations = new Locations(searchQuery, results);
      response.send(locations);
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
        // console.log(day.time);
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
      // console.log(eventsArray);
      response.status(200).send(eventsArray);
    })
    .catch(err =>{
      errorHandler(err, response);
    })
})


app.use('*', (request, response) => response.status(404).send('Location does not exist pal'));
