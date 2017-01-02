'use strict';

const _ = require('lodash');
const request = require('request');
const fallback = process.env.FALLBACK_URL || "https://relay0.r-a-d.io/main.mp3";
const xml = require('./xml');
const display = require('./display');

let relays = require('./relays');
let chosen = fallback;

const choose = () => chosen;
const update = () => display.update(relays, chosen);

const check = () => _.forOwn(relays, relay => {
    if (relay.disabled) {
        return;
    }

    request(relay.links.status, (error, res, body) => {
        if (error || !body.length) {
            return deactivate(relay);
        }

        xml.parse(body, count => activate(relay, count), () => deactivate(relay));
    });
});

const deactivate = relay => {
    relay.online = false;
    relay.listeners = 0;

    chosen = pick();
};

const activate = (relay, listeners) => {
    relay.online = true;
    relay.listeners = listeners;

    chosen = pick();
};

const select = relay => {
    _.forOwn(relays, function (relay) {
        relay.primary = false;
    });

    if (relay) {
        relay.primary = true;
    }
};

const pick = () => {
    let min = null;
    let candidate = undefined;

    _.forOwn(relays, relay => {
        if (!relay.online || relay.disabled) {
            return;
        }

        let ratio = (relay.listeners / relay.max) - (relay.priority / 1000);

        if (!min || ratio < min) {
            min = ratio;
            candidate = relay;
        }
    });

    if (candidate) {
        select(candidate);

        return candidate.links.stream;
    }

    select(false);

    return fallback;
};

const status = () => {
    let count = 0;

    _.forOwn(relays, relay => count += relay.listeners);

    return {
        relays: relays,
        total_listeners: count
    }
};

module.exports = {
    choose,
    relays: status,
    check,
    update,
};
