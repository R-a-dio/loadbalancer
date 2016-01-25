'use strict';

let express = require('express');
let status = require('./status');
let app = express();

status.check(); // initial check

setInterval(() => status.check(), 6000);

app.get('/', (req, res) => res.json({server_time: new Date().toISOString()}));
app.get('/main.mp3', (req, res) => res.redirect(302, status.choose()));
app.get('/status.json', (req, res) => res.json(status.relays()));

app.listen(3030);
