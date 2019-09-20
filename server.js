'use strict'

const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const DATABASE_URL = process.env.DATABASE_URL;
const yelp = require('yelp-fusion');
app.use(cors());

const PORT = process.env.PORT || 3000;

//connect database
const client = new pg.Client(DATABASE_URL);

client.on('error', errorHandler);

let lat = 0;
let lng = 0;
let currentCity = '';



function Locations (searchQuery, geoDataResults) {
  this.searchQuery = searchQuery.toLowerCase();
  this.formattedQuery = geoDataResults.formatted_address;
  this.latitude = geoDataResults.geometry.location.lat;
  this.longitude = geoDataResults.geometry.location.lng;
  lat = this.latitude;
  lng = this.longitude;
  currentCity = this.searchQuery;
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

function Movie(movieData){
  this.title = movieData.title;
  this.overview = movieData.overview;
  this.average_votes = movieData.vote_average;
  this.total_votes = movieData.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500/${movieData.poster_path}`;
  this.popularity = movieData.popularity;
  this.released_on = movieData.release_date;
}

function Restaurant(yelpData){
  this.name = yelpData.name;
  this.image_url = yelpData.image_url;
  this.price = yelpData.price;
  this.rating = yelpData.rating;
  this.url = yelpData.url;
}

function errorHandler(err, response){
  console.error(err);
  const errorObj = {
    status: 500,
    text: 'An error with the database has occurred. Please try again.'
  }
  response.status(500).send(errorObj);
}

// Location data
function checkNewLocation(request, response) {
  let searchQuery = request.query.data;
  let sqlQuery = `SELECT * FROM locations WHERE search_query='${searchQuery}';`
  client.query(sqlQuery)
    .then(queryResult => {
      if (queryResult.rowCount > 0){
        console.log('In database, sending row 1');
        currentCity = queryResult.rows[0].search_query;
        lat = queryResult.rows[0].latitude;
        lng = queryResult.rows[0].longitude;
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
  let values = [searchQuery, locations.formattedQuery, lat, lng];
  client.query(sql, values)
    .then(pgResults => {
      console.log('Asking Google, sending data to database');
    })
    .catch(error => errorHandler(error));
}

//Weather Data
function getWeather(request, response) {
  let searchQuery = request.query.data;
  console.log(searchQuery);
  let url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${lat},${lng}`
  superagentWeather(url, searchQuery, response)
}
function superagentWeather(url, searchQuery, response){
  superagent.get(url)
    .then(superagentResults => {
      response.status(200).send(newWeather(superagentResults, searchQuery));
    })
    .catch(err =>{
      errorHandler(err, response);
    })
}

function newWeather(superagentResults, searchQuery){
  const weatherDataResults = superagentResults.body;
  let weatherArray = weatherDataResults.daily.data.map(day => {
    const weather = new Weather(searchQuery, day);
    return weather;
  })
  return weatherArray;
}


function getEvents(request, response){
  let url = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${lng}&location.latitude=${lat}&expand=venue&token=${process.env.EVENT_API_KEY}`
  superagentEvent(url, response)
}

function superagentEvent(url, response){
  superagent.get(url)
    .then(superagentResults => {
      response.status(200).send(newEvent(superagentResults));
    })
    .catch(err =>{
      errorHandler(err, response);
    })
}

function newEvent(superagentResults){
  const eventResults = superagentResults.body;
  const eventsArray = eventResults.events.slice(0,10).map(event => {
    let theEvent = new Events (event);
    return theEvent;
  })
  return eventsArray;
}

function getMovies(request, response){
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&language=en-US&query=${currentCity}&page=1&include_adult=false`;
  superagentMovies(url, response);
}

function superagentMovies(url, response){
  superagent.get(url)
    .then(superagentResults => {

      response.send(newMovie(superagentResults));
    })
    .catch(error => console.log(error))
}

function newMovie(superagentResults){
  const movieResults = superagentResults.body;
  const moviesArray = movieResults.results.slice(0, 10).map(movie =>{
    let currentMovie = new Movie(movie);
    return currentMovie;
  })
  return moviesArray;
}

function getYelp(request, response){
  // Place holder for Yelp Fusion's API Key. Grab them
  // from https://www.yelp.com/developers/v3/manage_app
  const apiKey = process.env.YELP_API_KEY;

  const searchRequest = {
    term:'restaurant',
    location: currentCity
  };

  const client2 = yelp.client(apiKey);

  client2.search(searchRequest).then(yelpAPIResults => {
    response.send(newYelp(yelpAPIResults));
  }).catch(e => {
    console.log(e);
  });
}

function newYelp(yelpAPIResults){
  const yelpResult = yelpAPIResults.jsonBody.businesses;
  const yelpArray = yelpResult.slice(0, 20).map(restaurant =>{
    let currentRestaurant = new Restaurant(restaurant);
    return currentRestaurant;
  })
  return yelpArray;
}

app.get('/location', checkNewLocation)
app.get('/weather', getWeather)
app.get('/events', getEvents)
app.get('/movies', getMovies)
app.get('/yelp', getYelp)


app.use('*', (request, response) => response.status(404).send('Location does not exist pal'));


client.connect()
  .then(()=>{
    app.listen(PORT, () => console.log(`listening on ${PORT}`));
  })
  .catch(error => errorHandler(error));
