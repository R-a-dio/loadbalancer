var _ = require('lodash'),
    http = require('http'),
    https = require('https'),
    relays = require('./relays.json'),
    xml2js = require('xml2js').parseString,
    args = require('minimist')(process.argv.slice(2));

var listeners = {},
    fallback = "https://stream.r-a-d.io/main.mp3",
    chosen = fallback;

function logger(message) {
  if (args.v) {
    console.log(message)
  }
}

function check() {
  _.forOwn(relays, function (relay, key) {
    var client = relay.type == "https" ? https : http;

    client.get(relay.links.status, function (res) {
      var body = '';

      res.setEncoding("utf-8");
      res.on("data", function (chunk) { body += chunk });

      // actually process the body
      res.on("end", function () {
        if (!body) {
            logger("[" + key + "] body not found");
          return deactivate(key);
        }

        xml2js(body, function (err, result) {
          var tracks = _.get(result, 'playlist.trackList');

          if (tracks.length > 0) {
            var count = parser(_.get(tracks, '0.track.0.annotation.0', ''));

            relays[key].active = true;
            relays[key].listeners = count;
            listeners[key] = count;
          } else {
            deactivate(key);
          }
        });
      })
    }).on("error", function (e) {
      logger("[" + key + "] transport error");
      logger(e);
      deactivate(key);
    });
  });

  chosen = pick();
  logger("active relay is now " + chosen);
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
  var min = null;
  var relay = undefined;

  for (key in listeners) {
    if (!relays[key].active) continue;
    if (relays[key].type == "http") continue; // ignore http for now

    var ratio = listeners[key] / relays[key].max;
    ratio = ratio - (relays[key].priority / 1000);

    logger("[" + key + "] ratio: " + ratio);

    if (!min || ratio < min) {
      min = ratio;
      relay = key;
    }
  }

  if (relay) {
    return relays[relay].stream;
  }

  return fallback;
}

function status() {
  var count = 0;
  logger(listeners);
  for (key in listeners) {
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
