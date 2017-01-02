const xml2js = require('xml2js').parseString;
const _ = require('lodash');

const parse = (body, success, failure) => xml2js(body, parseXml(success, failure));

const parseListeners = annotation => {
    let listeners = annotation.match(/Current Listeners: (\d+)/i);

    return listeners !== null ? parseInt(listeners[1], 10) : 0;
};

const parseXml = (success, failure) => {
    return (err, result) => {
        let tracks = _.get(result, 'playlist.trackList');

        if (tracks.length <= 0 || err) {
            return failure(err);
        }

        let listeners = parseListeners(_.get(tracks, '0.track.0.annotation.0', ''));

        success(listeners);
    }
};

module.exports = { parse };
