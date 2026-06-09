const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withDarkBackground(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources.style = 
      config.modResults.resources.style?.map(style => {
        if (style.$.name === 'AppTheme') {
          style.item = style.item || [];
          style.item.push({
            $: { name: 'android:windowBackground' },
            _: '#08080a',
          });
        }
        return style;
      });
    return config;
  });
};
