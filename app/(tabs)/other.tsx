import React, { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { router, useFocusEffect } from 'expo-router';
import { AppCard } from '@/components/AppCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { BottomSheet, FilterPill, Icon, IndexTab, SignalButton, Stamp, type IconName } from '@/components/schale';
import { i18n, type Locale } from '@/constants/i18n';
import { THEMES, THEME_ORDER, type ThemeId } from '@/constants/theme';
import { useType } from '@/constants/typography';
import { fmt, useStrings } from '@/constants/strings/define';
import { senseiStrings } from '@/constants/strings/sensei';
import { themeName } from '@/constants/strings/themes';
import { useAdFreeContext } from '@/contexts/ad-free-context';
import { useAds } from '@/contexts/ads-context';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/contexts/theme-context';
import { TIP_SKUS } from '@/hooks/useAdFree';
import { useColors } from '@/hooks/useColors';
import InlineAd from '@/services/ads/InlineAd';
import { readCheckedAt } from '@/services/gamedata/cache';

const languages: { id: Locale; label: string }[] = [{id:'en',label:'English'},{id:'zh',label:'中文'},{id:'ko',label:'한국어'},{id:'ja',label:'日本語'},{id:'vi',label:'Tiếng Việt'},{id:'th',label:'ไทย'}];
const COOLDOWN = 3 * 60 * 60 * 1000;
function ThemePreview({ id }: { id: ThemeId }) {
 const {locale}=useLanguage(),{themeId,setThemeId}=useTheme(),type=useType(),c=useColors(),t=THEMES[id].tokens,selected=themeId===id;
 const edge=t.isDark?t.hairline:t.surfaceBorder;
 return <Pressable accessibilityRole="button" accessibilityLabel={themeName(id,locale)} accessibilityState={{selected}} onPress={()=>setThemeId(id)} style={{width:128,marginRight:10}}>
  <View style={{height:96,padding:10,borderRadius:14,backgroundColor:t.appBg,borderWidth:selected?2:StyleSheet.hairlineWidth,borderColor:selected?c.primaryInk:edge,justifyContent:'space-between'}}>
   <View style={{padding:8,borderRadius:8,backgroundColor:t.elevatedBg,borderWidth:StyleSheet.hairlineWidth,borderColor:edge,gap:5}}>
    <View style={{height:5,width:52,borderRadius:3,backgroundColor:t.textPrimary}}/>
    <View style={{height:4,width:34,borderRadius:2,backgroundColor:t.textMuted}}/>
   </View>
   <View style={{flexDirection:'row',alignItems:'center',gap:6}}>
    <View style={{height:12,width:40,borderRadius:6,backgroundColor:t.signal}}/>
    <View style={{height:12,width:12,borderRadius:6,backgroundColor:t.primaryColor}}/>
    <View style={{height:12,width:12,borderRadius:6,backgroundColor:t.secondary}}/>
   </View>
  </View>
  <View style={{flexDirection:'row',alignItems:'center',gap:4,marginTop:8}}>
   <Text numberOfLines={1} style={[type.caption,{color:selected?c.textPrimary:c.textSecondary,fontWeight:selected?'600':'500',flexShrink:1}]}>{themeName(id,locale)}</Text>
   {selected?<Icon name="check-circle" size={14} color={c.primaryInk}/>:null}
  </View>
 </Pressable>;
}

/** One line in a grouped settings list. */
function Row({first,icon,title,caption,value,onPress}:{first?:boolean;icon?:IconName;title:string;caption?:string;value?:string;onPress?:()=>void}){
 const c=useColors(),type=useType();
 const body=<View style={[rowStyles.row,!first&&{borderTopWidth:StyleSheet.hairlineWidth,borderTopColor:c.isDark?c.hairline:c.surfaceBorder}]}>
  {icon?<Icon name={icon} size={22} color={c.primaryInk}/>:null}
  <View style={{flex:1}}><Text style={[type.bodyStrong,{color:c.textPrimary}]}>{title}</Text>{caption?<Text style={[type.caption,{color:c.textMuted}]}>{caption}</Text>:null}</View>
  {value?<Text style={[type.body,{color:c.textSecondary,flexShrink:1,textAlign:'right'}]} numberOfLines={1}>{value}</Text>:null}
  {onPress?<Icon name="chevron-right" size={20} color={c.textMuted}/>:null}
 </View>;
 return onPress?<Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={({pressed})=>pressed?{opacity:.6}:null}>{body}</Pressable>:body;
}
const rowStyles=StyleSheet.create({row:{minHeight:56,flexDirection:'row',alignItems:'center',gap:14,paddingHorizontal:16,paddingVertical:12}});

export default function SenseiScreen() {
 const c=useColors(),type=useType(),s=useStrings(senseiStrings),{locale,setLocale}=useLanguage(),t=i18n[locale],game=useGameData(),ad=useAdFreeContext(),ads=useAds();
 const [sheet,setSheet]=useState<'support'|'feedback'|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[dataMessage,setDataMessage]=useState(''),[privacyMessage,setPrivacyMessage]=useState(''),[checking,setChecking]=useState(false),[checked,setChecked]=useState(0),[subject,setSubject]=useState(''),[description,setDescription]=useState('');
 const lastSent=useRef<number|null>(null),purchaseLock=useRef(false);
 useEffect(()=>{void readCheckedAt().then(setChecked);},[game.config.build,game.source]);
 useFocusEffect(React.useCallback(()=>{void readCheckedAt().then(setChecked);},[]));
 const open=(next:'support'|'feedback')=>{setMessage('');setSheet(next);};
 const refresh=async()=>{if(checking)return;setChecking(true);setDataMessage('');try{await game.refresh();setChecked(await readCheckedAt());setDataMessage(s.refreshed);}finally{setChecking(false);}};
 const buy=async(sku:string)=>{if(purchaseLock.current)return;purchaseLock.current=true;setBusy(true);setMessage('');try{if(await ad.purchaseTip(sku)==='success')setMessage(s.success);}catch{setMessage(s.purchaseError);}finally{purchaseLock.current=false;setBusy(false);}};
 const restore=async()=>{if(purchaseLock.current)return;purchaseLock.current=true;setBusy(true);setMessage('');try{setMessage(await ad.restorePurchase()==='success'?s.restored:s.restoreMissing);}catch{setMessage(s.restoreError);}finally{purchaseLock.current=false;setBusy(false);}};
 const send=async()=>{
  if(!subject.trim()){setMessage(t.miscTitleError);return;}if(!description.trim()){setMessage(s.descRequired);return;}
  if(lastSent.current&&Date.now()-lastSent.current<COOLDOWN){setMessage(fmt(t.miscFeedbackWait,{hours:Math.ceil((COOLDOWN-(Date.now()-lastSent.current))/3600000)}));return;}
  setBusy(true);setMessage('');try{await Linking.openURL(`mailto:chillandcodestudio@gmail.com?subject=${encodeURIComponent(`[Blue Archive Tool Feedback] ${subject.trim()}`)}&body=${encodeURIComponent(description.trim())}`);lastSent.current=Date.now();setSheet(null);setSubject('');setDescription('');}catch{setMessage(t.miscFeedbackFailed);}finally{setBusy(false);}
 };
 const privacy=async()=>{setPrivacyMessage('');try{if(!await ads.refreshPrivacy())setPrivacyMessage(s.privacyUnavailable);}catch{setPrivacyMessage(s.privacyError);}};
 const caption=[type.caption,{color:c.textSecondary}],body=[type.body,{color:c.textSecondary}],section=[type.section,{color:c.textPrimary}];
 const input={minHeight:48,padding:12,borderWidth:1,borderColor:c.hairline,color:c.textPrimary,backgroundColor:c.surfaceBg,borderRadius:12,...type.body};
 return <>
  <ScreenLayout title={s.title} headerRight={ad.isAdFree?<Stamp label={s.supporterBadge} tone="success"/>:undefined}>
   <IndexTab title={s.theme} style={{marginBottom:10}}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal:-20}} contentContainerStyle={{paddingHorizontal:20}}>{THEME_ORDER.map(id=><ThemePreview key={id} id={id}/>)}</ScrollView>
   <IndexTab title={s.language} style={{marginTop:24,marginBottom:6}}/>
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{languages.map(l=><FilterPill key={l.id} selected={locale===l.id} label={l.label} onPress={()=>setLocale(l.id)}/>)}</View>

   {!ad.isAdFree?<AppCard padding={18} style={{marginTop:28}}>
    <Text style={section}>{s.supporter}</Text>
    <Text style={[...caption,{marginTop:4}]}>{s.supportBody}</Text>
    <SignalButton style={{marginTop:16}} label={t.miscCoffeeButton} icon="heart-outline" onPress={()=>open('support')}/>
   </AppCard>:null}

   <AppCard padding={0} style={{marginTop:28}}>
    <Row first icon="bell-outline" title={s.notifications} caption={s.notificationsBody} onPress={()=>router.push('/reminders' as never)}/>
    <Row icon="cake-variant-outline" title={s.birthdays} onPress={()=>router.push('/birthdays')}/>
   </AppCard>

   <IndexTab title={s.data} style={{marginTop:28,marginBottom:10}}/>
   <AppCard padding={0}>
    <Row first title={s.build} value={String(game.config.build)}/>
    <Row title={s.source} value={game.source==='bundled'?s.bundled:s.cache}/>
    <Row title={s.checked} value={checked?new Date(checked).toLocaleString(locale,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):s.never}/>
    <Row icon="refresh" title={checking?'…':s.refresh} onPress={checking?undefined:()=>{void refresh();}}/>
   </AppCard>
   {dataMessage?<Text accessibilityRole="alert" style={[...caption,{marginTop:8}]}>{dataMessage}</Text>:null}

   <IndexTab title={s.about} style={{marginTop:28,marginBottom:10}}/>
   <AppCard padding={0}>
    <Row first title={s.version} value={Constants.expoConfig?.version??Application.nativeApplicationVersion??'-'}/>
    <Row icon="email-outline" title={s.feedback} caption={s.feedbackBody} onPress={()=>open('feedback')}/>
    <Row icon="shield-check-outline" title={s.privacy} caption={s.privacyBody} onPress={()=>{void privacy();}}/>
   </AppCard>
   {privacyMessage?<Text accessibilityRole="alert" style={[...caption,{marginTop:8}]}>{privacyMessage}</Text>:null}
   <Text style={[...caption,{marginTop:16,lineHeight:19}]}>{s.disclaimer}</Text>
   <View style={{marginTop:24}}><InlineAd/></View>
  </ScreenLayout>
  <BottomSheet visible={sheet!==null} onClose={()=>{if(!busy)setSheet(null);}} title={sheet==='support'?s.supporter:s.feedback}>
   {sheet==='support'?<><Text style={[...body,{marginBottom:16}]}>{ad.isAdFree?s.supportThanks:s.supportBody}</Text>{Platform.OS==='web'?<Text style={[...caption,{marginBottom:12}]}>{s.unavailable}</Text>:null}
    {([{sku:TIP_SKUS.SMALL,label:s.small,icon:'coffee-outline'},{sku:TIP_SKUS.LARGE,label:s.large,icon:'food-outline'}] as const).map(item=><View key={item.sku} style={{marginBottom:12,padding:16,borderRadius:16,backgroundColor:c.surfaceBg}}><View style={{flexDirection:'row',gap:10,alignItems:'center',marginBottom:12}}><Icon name={item.icon} size={26} color={c.primaryInk}/><View style={{flex:1}}><Text style={[type.bodyStrong,{color:c.textPrimary}]}>{item.label}</Text><Text style={[...caption,{marginTop:5}]}>{ad.productPrices?.[item.sku]??s.storePrice}</Text></View></View><SignalButton variant="ink" label={t.miscCoffeeButton} loading={busy} disabled={Platform.OS==='web'||busy} onPress={()=>{void buy(item.sku);}}/></View>)}
    {!ad.isAdFree?<SignalButton variant="ghost" label={s.restore} disabled={busy||Platform.OS==='web'} onPress={()=>{void restore();}}/>:null}
   </>:<><Text style={[...body,{marginBottom:16}]}>{s.feedbackBody}</Text><TextInput accessibilityLabel={s.feedbackTitle} placeholder={s.feedbackTitle} placeholderTextColor={c.textMuted} value={subject} onChangeText={setSubject} style={input}/><TextInput accessibilityLabel={s.feedbackDescription} placeholder={s.feedbackDescription} placeholderTextColor={c.textMuted} value={description} onChangeText={setDescription} multiline textAlignVertical="top" style={[input,{minHeight:140,marginVertical:12}]}/><SignalButton variant="ink" label={s.send} icon="email-outline" loading={busy} onPress={()=>{void send();}}/></>}
   {message?<Text accessibilityRole="alert" style={[type.body,{color:c.primaryInk,marginTop:16}]}>{message}</Text>:null}<SignalButton style={{marginTop:14}} variant="ghost" label={s.close} disabled={busy} onPress={()=>setSheet(null)}/>
  </BottomSheet>
 </>;
}
