import { View } from 'react-native';
import React, { useState } from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useAdFreeContext } from '@/contexts/ad-free-context';
import { useAds } from '@/contexts/ads-context';
import { adUnitId } from './adUnits';

const InlineAd = () => {
  const { isAdFree } = useAdFreeContext();
  const { ready, personalized } = useAds();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const unitId = adUnitId('banner');

  if (isAdFree || !ready || !unitId) return null;

  return (
    <View style={{ height: isAdLoaded ? 'auto' : 0 }}>
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

export default InlineAd;
