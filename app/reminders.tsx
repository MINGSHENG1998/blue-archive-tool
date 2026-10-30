import { Linking, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppCard } from '@/components/AppCard';
import { ScreenLayout } from '@/components/ScreenLayout';
import { NavBar, IndexTab, FilterPill, SignalButton, Icon } from '@/components/schale';
import { useType } from '@/constants/typography';
import { fmt, useStrings } from '@/constants/strings/define';
import { reminderStrings } from '@/constants/strings/reminders';
import { useReminders } from '@/contexts/notifications-context';
import { useColors } from '@/hooks/useColors';
import type { ReminderKind } from '@/services/notifications/planner';
export { ErrorBoundary } from 'expo-router';

export default function RemindersScreen() {
 const c = useColors(), type = useType(), s = useStrings(reminderStrings), r = useReminders();
 const rows: { key: ReminderKind; description: string }[] = [{ key:'bannerStart', description:s.bannerStartDesc }, { key:'bannerEnd', description:s.bannerEndDesc }, { key:'dailyReset', description:s.dailyResetDesc }, { key:'birthdays', description:s.birthdaysDesc }, { key:'apFull', description:s.apFullDesc }];
 return <ScreenLayout>
  <NavBar title={s.title} />
  <AppCard>
   <View style={{ flexDirection:'row', gap:12, alignItems:'center', marginBottom:12 }}><Icon name="bell-outline" size={30} color={c.primaryInk}/><Text style={[type.section, { color:c.textPrimary, flex:1 }]}>{s.permission}</Text></View>
   <Text style={[type.body, { color:c.textSecondary }]}>{!r.supported ? s.web : r.permission === 'granted' ? s.granted : r.permission === 'denied' ? s.denied : s.unknown}</Text>
   {r.supported && r.permission === 'denied' ? <SignalButton style={{ marginTop:16 }} label={s.settings} variant="ghost" onPress={() => { void Linking.openSettings().catch(() => {}); }} /> : null}
  </AppCard>
  <IndexTab title={s.title}/>
  <AppCard padding={16}>
   {rows.map(({key,description}) => <View key={key} style={{ paddingVertical:14, borderBottomWidth:1, borderColor:c.hairline }}>
    <View style={{ flexDirection:'row', alignItems:'center', gap:16 }}><View style={{ flex:1 }}><Text style={[type.bodyStrong,{color:c.textPrimary}]}>{s[key]}</Text><Text style={[type.caption,{color:c.textSecondary,marginTop:5}]}>{description}</Text></View><View style={{ minWidth:44,minHeight:44,justifyContent:'center' }}><Switch accessibilityLabel={s[key]} value={r.preferences[key]} disabled={!r.supported || !r.ready || r.busy} onValueChange={value=>{void r.setPreference(key,value);}} trackColor={{false:c.surfaceBorder,true:c.primaryColor}} thumbColor={c.elevatedBg}/></View></View>
    {key === 'birthdays' && r.preferences.birthdays ? <View style={{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:10}}>{(['watched','owned','all'] as const).map(scope=><FilterPill key={scope} label={s[scope]} selected={r.preferences.birthdayScope===scope} disabled={r.busy} onPress={()=>{void r.setPreference('birthdayScope',scope);}}/>)}</View> : null}
    {key === 'apFull' ? <SignalButton style={{marginTop:10}} compact variant="ghost" label={s.apLink} onPress={()=>router.push('/tools/ap' as never)}/> : null}
   </View>)}
  </AppCard>
  <Text style={[type.caption,{color:c.textSecondary,marginVertical:20}]}>{s.local}</Text>
  {r.error ? <AppCard tone={c.hazardColor}><Text accessibilityRole="alert" style={[type.body,{color:c.hazardColor,marginBottom:12}]}>{s.failed}</Text><SignalButton label={s.retry} variant="ghost" onPress={()=>{void r.refresh();}}/></AppCard>:null}
 </ScreenLayout>;
}
