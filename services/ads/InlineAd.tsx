import { StyleSheet, View, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useAdFreeContext } from '@/contexts/ad-free-context';
import { useAds } from '@/contexts/ads-context';
import { adUnitId } from './adUnits';

const InlineAd = () => {
  const { isAdFree } = useAdFreeContext();
  const { ready, personalized } = useAds();
  const { width } = useWindowDimensions();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const unitId = adUnitId('banner');

  if (isAdFree || !ready || !unitId) return null;

  // The SDK sizes an adaptive banner to the full window width whatever box it
  // sits in, so inside a screen's side padding it ran off the right edge. The
  // slot is window-wide and centred instead: it overhangs the padding equally
  // on both sides and lands edge to edge, with nothing of the ad cut off.
  return (
    <View style={[styles.slot, { width, height: isAdLoaded ? 'auto' : 0 }]}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: !personalized,
        }}
        onAdLoaded={() => setIsAdLoaded(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  slot: { alignSelf: 'center', alignItems: 'center' },
});

export default InlineAd;
