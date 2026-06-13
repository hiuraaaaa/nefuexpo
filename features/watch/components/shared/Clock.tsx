import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';

export function Clock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  );
  useEffect(() => {
    const interval = setInterval(() =>
      setTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
    , 1000);
    return () => clearInterval(interval);
  }, []);
  return <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' }}>{time}</Text>;
}
