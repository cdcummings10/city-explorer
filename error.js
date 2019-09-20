'use strict';

function errorHandler(err, response){
  console.error(err);
  const errorObj = {
    status: 500,
    text: 'An error with the database has occurred. Please try again.'
  }
  response.status(errorObj.status).send(errorObj);
}

module.exports = errorHandler;
