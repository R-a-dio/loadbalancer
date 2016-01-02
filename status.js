var relays = require('./relays.json'),
    listeners = {},
    fallback = "https://stream.r-a-d.io/main.mp3",
    https = require('https'),
    http = require('http'),
    xml2js = require('xml2js').parseString,
    _ = require('lodash');

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
          console.log("[" + key + "] body not found");
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
      console.log("[" + key + "] transport error");
      console.log(e);
      deactivate(key);
    });
  })
}

function deactivate(key) {
  console.log("[" + key + "] deactivating");
  relays[key].active = false;
  relays[key].listeners = 0;
  listeners[key] = 0;
}

function parser(annotation) {
  var listeners = annotation.match(/Current Listeners: (\d+)/i);

  return listeners != null ? parseInt(listeners[1], 10) : 0;
}

function choose() {
  // TODO: figure out how to assign priority + capacity
}

function status() {
  var count = 0;
  console.log(listeners);
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
