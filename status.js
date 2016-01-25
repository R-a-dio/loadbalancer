'use strict';

let _ = require('lodash'),
    request = require('request'),
    relays = require('./relays.json'),
    xml2js = require('xml2js').parseString,
    args = require('minimist')(process.argv.slice(2)),
    listeners = {},
    fallback = "https://stream.r-a-d.io/main.mp3",
    chosen = fallback;

function logger(message) {
  if (args.v) {
    console.log(message)
  }
}

function check() {
  _.forOwn(relays, (relay, key) =>
    request(relay.links.status, (error, res, body) => {
      if (error || ! body.length) {
        logger("[" + key + "] transport error");
        logger(error);
        deactivate(key);
        chosen = pick();
        return;
      }

      xml2js(body, (err, result) => {
        let tracks = _.get(result, 'playlist.trackList');

        if (tracks.length > 0) {
          let count = parser(_.get(tracks, '0.track.0.annotation.0', ''));

          relays[key].active = true;
          relays[key].listeners = count;
          listeners[key] = count;
          chosen = pick();
        } else {
          deactivate(key);
          chosen = pick();
        }
      })
    })
  )
}

function deactivate(key) {
  logger("[" + key + "] deactivating");
  relays[key].active = false;
  relays[key].listeners = 0;
  listeners[key] = 0;
}

function parser(annotation) {
  var listeners = annotation.match(/Current Listeners: (\d+)/i);

  return listeners != null ? parseInt(listeners[1], 10) : 0;
}

function choose() {
  return chosen;
}

function pick() {
  let min = null;
  let relay = undefined;

  for (var key in listeners) {
    if (!relays[key].active || !relays[key].usable) continue;

    let ratio = (listeners[key] / relays[key].max) - (relays[key].priority / 1000);

    logger("[" + key + "] ratio: " + ratio);

    if (!min || ratio < min) {
      min = ratio;
      relay = key;
    }
  }

  if (relay) {
    logger("active relay is now: " + relays[relay].stream)
    return relays[relay].stream;
  }

  logger("active relay is now [fallback]: " + fallback);
  return fallback;
}

function status() {
  let count = 0;

  for (var key in listeners) {
    count += listeners[key];
  }

  return {
    relays: relays,
    listeners: count
  }
}

module.exports = {
  choose: choose,
  relays: status,
  check: check
}
