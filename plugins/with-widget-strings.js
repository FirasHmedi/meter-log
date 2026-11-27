// Translates the widget's name and description in the Android widget picker (English by default, French).
// react-native-android-widget writes the label as given, so app.json points the label and description to the resources written here.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const STRINGS = {
  values: { label: 'Log a reading', description: 'Last reading of each meter. Tap a meter to log a new reading.' },
  'values-fr': {
    label: 'Noter un relevé',
    description: 'Dernier relevé de chaque compteur. Touchez un compteur pour noter un relevé.',
  },
};

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/'/g, "\\'");

module.exports = function withWidgetStrings(config) {
  return withDangerousMod(config, [
    'android',
    (cfg) => {
      const res = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res');
      for (const [dir, s] of Object.entries(STRINGS)) {
        fs.mkdirSync(path.join(res, dir), { recursive: true });
        const items = [`  <string name="widget_logreading_label">${escape(s.label)}</string>`];
        if (s.description) items.push(`  <string name="widget_logreading_desc">${escape(s.description)}</string>`);
        fs.writeFileSync(path.join(res, dir, 'widget_strings.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${items.join('\n')}\n</resources>\n`);
      }
      return cfg;
    },
  ]);
};
