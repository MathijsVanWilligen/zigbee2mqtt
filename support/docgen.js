/**
 * This script generates the supported devices page.
 * Run by executing: npm run docs
 */

const plannedToSupport = [
    {
        model: 'SJCGQ11LM',
        description: 'Aqara water leak sensor',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'MFKZQ01LM',
        description: 'Mi magic cube controller',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'WXKG03LM',
        description: 'Aqara single key wireless wall switch',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'QBKG11LM',
        description: 'Aqara single key wired wall switch',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'QBKG03LM',
        description: 'Aqara double key wired wall switch',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'ZNCZ02LM',
        description: 'Mi power plug ZigBee',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'QBCZ11LM',
        description: 'Aqara wall socket',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'JTYJ-GD-01LM/BW',
        description: 'MiJia Honeywell smoke detector',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'KTBL01LM',
        description: 'Aqara air conditioning companion',
        supports: '-',
        vendor: 'Xiaomi',
    },
    {
        model: 'KTBL02LM',
        description: 'Aqara air conditioning companion 2',
        supports: '-',
        vendor: 'Xiaomi',
    },
];

const zigbee2mqtt = require('../lib/converters/zigbee2mqtt');
const deviceMapping = require('../lib/devices');
const fs = require('fs');
const YAML = require('json2yaml');

// Sanity check if all supported devices are in deviceMapping
const supportedDevices = new Set();
zigbee2mqtt.forEach((p) => supportedDevices.add(...p.devices));

// Check if in deviceMapping.
supportedDevices.forEach((s) => {
    if (!Object.values(deviceMapping).find((d) => d.model === s)) {
        console.log(`ERROR: ${s} not in deviceMapping`);
    }
});

const outputdir = process.argv[2];

if (!outputdir) {
    console.error("Please specify an output directory");
}

let file = 'Supported-devices.md';
let text = '*NOTE: Automatically generated by `npm run docgen`*\n';
text += `
In case your device is **NOT** listed here, please create an issue at: https://github.com/Koenkk/zigbee2mqtt/issues
\n`;

const logDevices = (devices) => {
    let result = '';
    result += '| Model | Description | Picture |\n';
    result += '| ------------- | ------------- | -------------------------- |\n';

    devices.forEach((device) => {
        result += `| ${device.model} | ${device.vendor} ${device.description} (${device.supports}) | ![${device.model}](images/devices/${device.model.replace('/', '-')}.jpg) |\n`;
    });

    return result;
}

const vendors = Array.from(new Set(Object.values(deviceMapping).map((d) => d.vendor)));
vendors.sort();
vendors.forEach((vendor) => {
    text += `### ${vendor}\n`;
    text += logDevices(Object.values(deviceMapping).filter((d) => d.vendor === vendor));
    text += '\n';
})

fs.writeFileSync(outputdir + '/' + file, text);


file = 'Integrating-with-home-assistant.io.md';
text = '*NOTE: Automatically generated by `npm run docgen`*\n\n';
text += 'The easiest way to integrate zigbee2mqtt with home assistant is by using [MQTT discovery](https://www.home-assistant.io/docs/mqtt/discovery/).'
text += ' To enable MQTT discovery set `homeassistant_discovery: true` in your zigbee2mqtt `configuration.yaml` and add the following to your home assistant `configuration.yaml`.\n'
text += '```yaml\n'
text += 'mqtt:\n'
text += '  discovery: true\n'
text += '```\n'

text += '\n\n'

text += 'To respond to button clicks you can use the following home assistant configuration:\n'
text += '```yaml'
text += `
automation:
  - alias: Respond to button clicks
    trigger:
      platform: mqtt
      topic: 'zigbee2mqtt/<FRIENDLY_NAME'
    condition:
      condition: template
      value_template: "{{ 'single' == trigger.payload_json.click }}"
    action:
      entity_id: light.bedroom
      service: light.toggle
`
text += '```\n'

text += 'In case you **dont** want to use home assistants MQTT discovery you can use the configuration below.\n\n'

const homeassistantConfig = (device) => {
    const payload = {
        platform: 'mqtt',
        state_topic: "zigbee2mqtt/<FRIENDLY_NAME>",
        availability_topic: "zigbee2mqtt/bridge/state",
        ...device.discovery_payload,
    };

    if (payload.command_topic) {
        payload.command_topic = `zigbee2mqtt/<FRIENDLY_NAME>/set`;
    }

    let yml = YAML.stringify([payload]);
    yml = yml.replace(/(-) \n    /g, '- ');
    yml = yml.replace('---', `${device.type}:`)
    return yml;
}

Object.values(deviceMapping).forEach((device) => {
    text += `### ${device.model}\n`;
    text += '```yaml\n'

    device.homeassistant.forEach((d, i) => {
        text += homeassistantConfig(d);
        if (device.homeassistant.length > 1 && i < device.homeassistant.length - 1) {
            text += '\n';
        }
    })

    text += '```\n\n';
});

fs.writeFileSync(outputdir + '/' + file, text);
