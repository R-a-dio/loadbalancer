const _ = require('lodash');
const url = require('url');

let original = require('../relays.json');
let relays = {};

_.forOwn(original, (relay, key) => {
    relays[url.parse(key).hostname] = {
        online: null,
        primary: false,
        disabled: relay.disabled || false,
        noredir: relay.noredir || false,
        listeners: 0,
        max: relay.max,
        priority: relay.priority,
        links: {
            status: key + '.xspf',
            stream: key
        },
    };
});

module.exports = relays;
