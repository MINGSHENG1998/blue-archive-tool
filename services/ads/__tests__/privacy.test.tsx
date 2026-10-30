import React from 'react';
import {renderHook,act} from '@testing-library/react-native';
import {AdsConsent} from 'react-native-google-mobile-ads';
import {AdsProvider,useAds} from '@/contexts/ads-context';
import {gatherAdsConsent,readCurrentAdsConsent} from '../consent';
import {initInterstitial,stopInterstitial} from '../interstitial';

jest.mock('react-native-google-mobile-ads',()=>({
 __esModule:true, default:()=>({initialize:jest.fn(async()=>{})}),
 AdsConsentStatus:{NOT_REQUIRED:'NOT_REQUIRED'},
 AdsConsent:{gatherConsent:jest.fn(),getConsentInfo:jest.fn(),getUserChoices:jest.fn(),showPrivacyOptionsForm:jest.fn()},
}));
jest.mock('expo-tracking-transparency',()=>({requestTrackingPermissionsAsync:jest.fn(async()=>({status:'granted'}))}));
jest.mock('../interstitial',()=>({initInterstitial:jest.fn(),stopInterstitial:jest.fn()}));
const ump=AdsConsent as unknown as Record<string,jest.Mock>;
beforeEach(()=>{
 jest.clearAllMocks();
 ump.gatherConsent.mockResolvedValue({canRequestAds:true,status:'OBTAINED'});
 ump.getConsentInfo.mockResolvedValue({canRequestAds:true,status:'OBTAINED',privacyOptionsRequirementStatus:'REQUIRED'});
 ump.getUserChoices.mockResolvedValue({selectPersonalisedAds:true});
 ump.showPrivacyOptionsForm.mockResolvedValue({});
});
const wrapper=({children}:{children:React.ReactNode})=><AdsProvider>{children}</AdsProvider>;
test('privacy refresh rereads choices and replaces personalization immediately',async()=>{
 const {result}=renderHook(()=>useAds(),{wrapper});
 await act(async()=>{});
 expect(result.current.personalized).toBe(true);
 ump.getUserChoices.mockResolvedValue({selectPersonalisedAds:false});
 await act(async()=>{expect(await result.current.refreshPrivacy()).toBe(true);});
 expect(result.current).toMatchObject({ready:true,personalized:false});
 expect(initInterstitial).toHaveBeenLastCalledWith(false);
 expect(stopInterstitial).toHaveBeenCalled();
 expect(ump.getConsentInfo).toHaveBeenCalledTimes(2);
});
test('revoked request consent closes the ad gate and drops preloaded interstitials',async()=>{
 const {result}=renderHook(()=>useAds(),{wrapper});
 await act(async()=>{});
 ump.showPrivacyOptionsForm.mockImplementation(async()=>{ump.getConsentInfo.mockResolvedValue({canRequestAds:false,status:'REQUIRED'});});
 await act(async()=>{await result.current.refreshPrivacy();});
 expect(result.current).toMatchObject({ready:false,personalized:false});
 expect(stopInterstitial).toHaveBeenCalled();
 expect(initInterstitial).toHaveBeenCalledTimes(1);
});
test('an unavailable form still rereads the current decision',async()=>{
 const {result}=renderHook(()=>useAds(),{wrapper});await act(async()=>{});
 ump.getConsentInfo.mockResolvedValue({canRequestAds:false,status:'REQUIRED',privacyOptionsRequirementStatus:'NOT_REQUIRED'});
 await act(async()=>{expect(await result.current.refreshPrivacy()).toBe(false);});
 expect(ump.showPrivacyOptionsForm).not.toHaveBeenCalled();
 expect(result.current.ready).toBe(false);
});
test('a failed refresh keeps requests disabled and reports the failure',async()=>{
 const {result}=renderHook(()=>useAds(),{wrapper});await act(async()=>{});
 ump.showPrivacyOptionsForm.mockRejectedValue(new Error('form failed'));
 await act(async()=>{await expect(result.current.refreshPrivacy()).rejects.toThrow('form failed');});
 expect(result.current.ready).toBe(false);
});
test('outside consent regions current UMP info permits personalized ads without TCF choices',async()=>{
 ump.getConsentInfo.mockResolvedValue({canRequestAds:true,status:'NOT_REQUIRED'});
 expect(await readCurrentAdsConsent()).toEqual({canRequestAds:true,personalized:true});
 expect(ump.getUserChoices).not.toHaveBeenCalled();
});
test('an offline consent refresh cannot allow requests when cached UMP consent forbids them',async()=>{
 ump.gatherConsent.mockRejectedValue(new Error('offline'));
 ump.getConsentInfo.mockResolvedValue({canRequestAds:false,status:'REQUIRED'});
 const warn=jest.spyOn(console,'warn').mockImplementation(()=>{});
 try { expect(await gatherAdsConsent()).toEqual({canRequestAds:false,personalized:false}); }
 finally { warn.mockRestore(); }
});
test('an offline consent refresh reuses the actual permitted cached choice',async()=>{
 ump.gatherConsent.mockRejectedValue(new Error('offline'));
 ump.getUserChoices.mockResolvedValue({selectPersonalisedAds:false});
 const warn=jest.spyOn(console,'warn').mockImplementation(()=>{});
 try { expect(await gatherAdsConsent()).toEqual({canRequestAds:true,personalized:false}); }
 finally { warn.mockRestore(); }
});
test('unavailable UMP state keeps ad requests disabled',async()=>{
 ump.gatherConsent.mockRejectedValue(new Error('offline'));
 ump.getConsentInfo.mockRejectedValue(new Error('unavailable'));
 const warn=jest.spyOn(console,'warn').mockImplementation(()=>{});
 try { expect(await gatherAdsConsent()).toEqual({canRequestAds:false,personalized:false}); }
 finally { warn.mockRestore(); }
});
