import { View } from 'react-native';
import * as Device from 'expo-device';
import React, { useState } from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useAdFreeContext } from '@/contexts/ad-free-context';

const iosAdmobBanner = 'ca-app-pub-7252717983754109/7446508117';
const androidAdmobBanner = 'ca-app-pub-7252717983754109/7446508117';
const productionID =
  Device.osName === 'Android' ? androidAdmobBanner : iosAdmobBanner;

const InlineAd = () => {
  const { isAdFree } = useAdFreeContext();
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  if (isAdFree) return null;

  return (
    <View style={{ height: isAdLoaded ? 'auto' : 0 }}>
      <BannerAd
        unitId={__DEV__ ? TestIds.BANNER : productionID}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => setIsAdLoaded(true)}
      />
    </View>
  );
};

export default InlineAd;