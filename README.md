# lab-06-repository

# City Explorer

**Author**: Chris Cummings and Darrik Puetz
**Version**: 1.0.0 (increment the patch/fix version number if you make more commits past your first submission)

## Overview
<!-- Provide a high level overview of what this application is and why you are building it, beyond the fact that it's an assignment for this class. (i.e. What's your problem domain?) -->
This application displays map, weather, yelp, movies, events and hiking data based on the city searched.

## Getting Started
<!-- What are the steps that a user must take in order to build this app on their own machine and get it running? -->
1) Obtain JSON files or database/APIs needed for grabbing data.
2) Create backend with express, cors, and dotenv.
3) Create get functions for different categories (i.e. weather, location, etc.)
4) Create constructor functions to normalize data.
5) Return data based on correct inputs.

## Architecture
<!-- Provide a detailed description of the application design. What technologies (languages, libraries, etc) you're using, and any other relevant design information. -->
APIs needed:
    Google Maps
    Dark Sky
    Yelp
    The Movies DB
    EventBrite
    Hiking Project

## Change Log
<!-- Use this area to document the iterative changes made to your application as each feature is successfully implemented. Use time stamps. Here's an examples:

01-01-2001 4:59pm - Application now has a fully-functional express server, with a GET route for the location resource.

## Credits and Collaborations
<!-- Give credit (and a link) to other people or resources that helped you build this application. -->
Version 1.0.0
    Branch lab06
        Created server
        Added Constructor functions for location and weather
        Added get functions for retrieving JSON data
        Added if statement to check for correct city input

Version 1.0.1
        Branch lab08
        

## Number and name of feature: Complete User Acceptance Tests

## Estimate of time needed to complete: 4hrs

## Start time: 9:05am

## Finish time: 11:15am

## Actual time needed to complete: 2hrs 10min
