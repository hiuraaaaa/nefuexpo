const { withAndroidStyles } = require('@expo/config-plugins');

module.exports = function withDarkBackground(config) {
  return withAndroidStyles(config, (config) => {
    config.modResults.resources.style =
      config.modResults.resources.style?.map(style => {
        if (style.$.name === 'AppTheme') {
          // Pastikan parent = Theme.EdgeToEdge biar edge-to-edge aktif
          style.$.parent = 'Theme.EdgeToEdge';

          style.item = style.item || [];

          // Hapus item duplikat kalau ada
          style.item = style.item.filter(
            (item) => ![
              'android:windowBackground',
              'android:navigationBarColor',
              'android:statusBarColor',
              'android:windowDrawsSystemBarBackgrounds',
              'android:enforceNavigationBarContrast',
            ].includes(item.$.name)
          );

          style.item.push(
            { $: { name: 'android:windowBackground' },              _: '#08080a'    },
            { $: { name: 'android:navigationBarColor' },            _: '@android:color/transparent' },
            { $: { name: 'android:statusBarColor' },                _: '@android:color/transparent' },
            { $: { name: 'android:windowDrawsSystemBarBackgrounds' }, _: 'true'     },
            { $: { name: 'android:enforceNavigationBarContrast' },  _: 'false'      },
          );
        }
        return style;
      });
    return config;
  });
};
