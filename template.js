app.get('/location', (request, response) => {
  let column = 'locations';
  let searchQuery = request.query.data;
  let sqlQuery = `SELECT * FROM ${column} WHERE search_query='${searchQuery}';`
  client.query(sqlQuery)
    .then(queryResult => {
      if (queryResult.rowCount > 0){
        console.log('In database, sending row 1');
        response.send(queryResult.rows[0])
      }
      else {
        let url = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`
        apiAsk(url, searchQuery, response);
        //send to front end
      })
      .catch(err => errorHandler(err, response));
    })
    
    
    function apiAsk(url, searchQuery, res){
      superagent.get(url)
        .then(superagentResults => {
          //create new object?
          let results = superagentResults.body.results[0]; //separate for each one
          let locations = new Locations(searchQuery, results); //separate for each one
          //send to database
          let sql = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);'
          let values = [searchQuery, locations.formattedQuery, lat, lng]; //separate for each one
          client.query(sql, values)
            .then(pgResults => {
              console.log('Asking Google, sending data to database');
            })
            .catch(error => errorHandler(error));
          res.send(locations);
        })
    }
