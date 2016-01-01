var relays = require('./relays.json');
var http = require('http');
var xml2js = require('xml2js').parseString;
var _ = require('lodash');

function check() {
  _.forOwn(relays, function () {
    http.get(relay.links.keepalive, function (res) {
      var body = '';

      res.setEncoding("utf-8");
      res.on("data", function (chunk) { body += chunk });

      // actually process the body
      res.on("end", function () {
        if (!body) return deactivate(relay);

        var response = xml2js(body);
        var tracks   = _.get(response, 'playlist.trackList');

        if (tracks && tracks.length > 0) {
          relay.active = true;
          relay.listeners = listeners(_.get(tracks[0], 'track.annotation', ''));
        } else {
          deactivate(relay);
        }
      })
    }).on("error", function (e) { deactivate(relay) });
  })
}

function deactivate(relay) {
  relay.active = false;
  relay.listeners = 0;
}

function listeners(annotation) {
  var listeners = annotation.match(/Current Listeners: (\d+)/);

  return listeners ? listeners[0] : 0;
}

function register() {
  setTimeout(check, 10000);
}

function choose() {
  // TODO: figure out how to assign priority + capacity
}

function status() {
  return relays
}

module.exports = {
  register: register,
  choose: choose,
  relays: status
}
