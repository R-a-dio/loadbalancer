var express = require('express');
var status = require('./status');
var app = express();

status.register();

app.get('/', function (req, res) {
  res.json({relays: status.alive(), server_time: new Date().toISOString()})
});

app.get('/main.mp3', function (req, res) {
  res.location(status.choose())
});

app.get('/status.json', function (req, res) {
  res.json(status.relays)
});

app.listen(3030);
