import React from 'react';
import { View } from 'react-native';

export const IconPrev = ({ color = '#fff', size = 28 }: { color?: string; size?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <View style={{ width: 3, height: size * 0.75, backgroundColor: color, borderRadius: 2 }} />
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 0, height: 0, borderTopWidth: size*0.4, borderBottomWidth: size*0.4, borderRightWidth: size*0.5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color }} />
      <View style={{ width: 0, height: 0, borderTopWidth: size*0.4, borderBottomWidth: size*0.4, borderRightWidth: size*0.5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderRightColor: color, marginLeft: -size*0.2 }} />
    </View>
  </View>
);

export const IconNext = ({ color = '#fff', size = 28 }: { color?: string; size?: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 0, height: 0, borderTopWidth: size*0.4, borderBottomWidth: size*0.4, borderLeftWidth: size*0.5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color }} />
      <View style={{ width: 0, height: 0, borderTopWidth: size*0.4, borderBottomWidth: size*0.4, borderLeftWidth: size*0.5, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: color, marginLeft: -size*0.2 }} />
    </View>
    <View style={{ width: 3, height: size * 0.75, backgroundColor: color, borderRadius: 2 }} />
  </View>
);

export const IconPlay = ({ size = 28 }: { size?: number }) => (
  <View style={{ width: 0, height: 0, borderTopWidth: size*0.55, borderBottomWidth: size*0.55, borderLeftWidth: size*0.9, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: size*0.2 }} />
);

export const IconPause = ({ size = 28 }: { size?: number }) => (
  <View style={{ flexDirection: 'row', gap: size * 0.25 }}>
    <View style={{ width: size*0.22, height: size*0.9, backgroundColor: '#fff', borderRadius: 3 }} />
    <View style={{ width: size*0.22, height: size*0.9, backgroundColor: '#fff', borderRadius: 3 }} />
  </View>
);

export const IconFullscreen = ({ exit = false }: { exit?: boolean }) => {
  const c = '#fff'; const sz = 7; const t = 2;
  if (exit) return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: sz-t, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: sz-t, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: sz-t, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: sz-t, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: sz-t, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: sz-t, width: t, height: sz, backgroundColor: c }} />
    </View>
  );
  return (
    <View style={{ width: 18, height: 18 }}>
      <View style={{ position: 'absolute', top: 0, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, left: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', top: 0, right: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, width: t, height: sz, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: sz, height: t, backgroundColor: c }} />
      <View style={{ position: 'absolute', bottom: 0, right: 0, width: t, height: sz, backgroundColor: c }} />
    </View>
  );
};
