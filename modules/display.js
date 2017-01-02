const cli = require('clui');
const color = require('cli-color');
const _ = require('lodash');

const update = relays => {
    let buffer = new cli.LineBuffer();
    let max = _.keys(relays).reduce((a, b) => a.length > b.length ? a : b).length + 2;

    _.forOwn(relays, (relay, key) => {
        let styles = status(relay);

        new cli.Line(buffer)
            .padding(1)
            .column('[', 1)
            .column(styles.text, styles.width, styles.style)
            .column(']', 1)
            .column(' ' + key + '  ', max)
            .column(gauge(relay), 23)
            .column('' + relay.listeners, 4, [color.blackBright])
            .column(' listeners', 10, [color.blackBright])
            .fill()
            .store();
    });

    buffer.output();
};

const gauge = relay => cli.Gauge(
    relay.listeners + 1, // value
    relay.max + 1,       // max
    20                   // width
);

const status = relay => {
    let text = '?';
    let style = color.blackBright;

    if (relay.disabled) {
        text = 'D';
        style = color.red;
    } else if (relay.primary && relay.online) {
        text = '*';
        style = color.cyan;
    } else if (relay.online) {
        text = '+';
        style = color.green;
    } else if (!relay.online) {
        text = '-';
        style = color.red;
    }

    return {
        text,
        style: [style],
        width: 1,
    };
};

module.exports = {
    update,
};
