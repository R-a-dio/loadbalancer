'use strict';

const express = require('express');
const parser = require('body-parser');
const status = require('./modules/status');
const app = express();
const clc = require('cli-color');

status.check(); // initial check before we listen

console.log(clc.reset); // reset the screen

setInterval(() => status.check(), 6000);
setInterval(() => status.update(), 3000);

app.get('/', (req, res) => res.json({server_time: new Date().toISOString()}));
app.get('/main.mp3', (req, res) => res.redirect(302, status.choose()));
app.get('/status.json', (req, res) => res.json(status.relays()));

app.listen(process.env.PORT || 3030, process.env.HOST || 'localhost');

// const management = express();
// const config = require('./config');
//
// middleware for input
// config.use(parser.json());
// config.use(parser.urlencoded({ extended: true }));
//
// CRUD operations
// config.get('/status.json', (req, res) => res.json(status.relays()));
// config.put('/relay/:relay', (req, res) => res.json(config.update(req.params.relay, req.body)));
// config.post('/relay', (req, res) => res.json(config.create(req.body)));
// config.delete('/relay/:relay', (req, res) => res.json(config.delete(req.params.relay)));
//
// listen on a custom port
// config.listen(process.env.CONFIG_PORT || 4040);
