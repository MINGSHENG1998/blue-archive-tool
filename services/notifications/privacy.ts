import { AdsConsent } from 'react-native-google-mobile-ads';
/** User-initiated UMP privacy options; no consent form is opened automatically. */
export async function showPrivacyOptions(): Promise<boolean> {
  const info = await AdsConsent.getConsentInfo();
  if (info.privacyOptionsRequirementStatus !== 'REQUIRED') return false;
  await AdsConsent.showPrivacyOptionsForm();
  return true;
}
