var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();

// saving to db is disabled for now ...
//var mongoose = require('mongoose');
//var location = require('./models/location')(); 
//mongoose.connect('mongodb://localhost:27017/sampledb');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); 

var server = app.listen(3000, function () {
   console.log('Listening on port %s...', server.address().port);
});
