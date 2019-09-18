'use strict'

const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const cors = require('cors');

app.use(cors());

const PORT = process.env.PORT || 3000;



app.listen(PORT, () => console.log(`listening on ${PORT}`));

function Locations (searchQuery, geoDataResults) {
  this.searchQuery = searchQuery;
  this.formattedQuery = geoDataResults.results[0].formatted_address;
  this.latitude = geoDataResults.results[0].geometry.location.lat;
  this.longitude = geoDataResults.results[0].geometry.location.lng;
}


function Weather (searchQuery, weatherDataResults) {
  //   this.searchQuery = searchQuery;
  this.forecast = weatherDataResults.daily.summary;
  this.time = new Date(weatherDataResults.daily.data[0].time).toDateString();
  console.log(this);
}

app.get('/location', (request, response) => {
  try{
    let searchQuery = request.query.data;
    const geoDataResults = require('./data/geo.json');
    const locations = new Locations(searchQuery, geoDataResults);
    response.status(200).send(locations);
  }
  catch(err){
    response.status(500).send('Sorry, invalid input there buddy');
    console.error(err);
  }
});

app.get('/weather', (request, response) => {
  try{
    let weatherArray = [];
    let searchQuery = request.query.data;
    const weatherDataResults = require('./data/darksky.json');
        
    const weather = new Weather(searchQuery, weatherDataResults);
    weatherArray.push(weather);
    response.status(200).send(weatherArray);
  }
  catch(err){
    console.error(err);
  }
});

app.use('*', (request, response) => response.status(404).send('Location does not exist pal'));
