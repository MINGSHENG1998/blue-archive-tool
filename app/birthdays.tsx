import { useEffect, useMemo, useState } from 'react';
import { AppState, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { AppCard, EmptyState, FilterPill, Icon, IndexTab, NavBar, ScreenLayout, SearchField, SignalButton, SlantPortrait, Stamp } from '@/components/schale';
import { birthdayStrings } from '@/constants/strings/birthdays';
import { fmt, useStrings } from '@/constants/strings/define';
import { useType } from '@/constants/typography';
import { useGameData } from '@/contexts/gamedata-context';
import { useLanguage } from '@/contexts/language-context';
import { useColors } from '@/hooks/useColors';
import InlineAd from '@/services/ads/InlineAd';
import { studentIconUris, upcomingBirthdays, type StudentBirthday } from '@/services/gamedata';
export { ErrorBoundary } from 'expo-router';

function BirthdayRow({entry,relative=false}:{entry:StudentBirthday;relative?:boolean}) {
 const c=useColors(),type=useType(),s=useStrings(birthdayStrings),{displayName}=useGameData(),{locale}=useLanguage();
 const name=displayName(entry.student);
 const date=new Date(2000,entry.birthday.month-1,entry.birthday.day).toLocaleDateString(locale,{month:'short',day:'numeric'});
 const label=entry.daysUntil===0?s.today:entry.daysUntil===1?s.tomorrow:fmt(s.inDays,{days:entry.daysUntil});
 return <Pressable accessibilityRole="button" accessibilityLabel={fmt(s.open,{name})} onPress={()=>router.push(`/student/${entry.student.Id}`)} style={({pressed})=>({minHeight:76,paddingVertical:10,flexDirection:'row',alignItems:'center',gap:14,borderBottomWidth:1,borderColor:c.hairline,opacity:pressed?0.7:1})}>
  <SlantPortrait uris={studentIconUris(entry.student.Id)} label={name} size={44}/>
  <View style={{flex:1}}><Text style={[type.bodyStrong,{color:c.textPrimary}]}>{name}</Text><Text style={[type.caption,{color:c.textSecondary,marginTop:5}]}>{date}</Text></View>
  {relative?<Stamp label={label} tone={entry.daysUntil===0?'success':'primary'} size="sm" animate={false}/>:<Icon name="chevron-right" size={20} color={c.textMuted}/>}
 </Pressable>;
}

export default function BirthdaysScreen() {
 const c=useColors(),type=useType(),s=useStrings(birthdayStrings),{locale}=useLanguage(),{students,displayName}=useGameData();
 const {width}=useWindowDimensions();
 const calendarWidth=Math.min(420,Math.max(308,width-64));
 const [now,setNow]=useState(()=>new Date()),[month,setMonth]=useState(()=>new Date().getMonth()),[year,setYear]=useState(()=>new Date().getFullYear()),[day,setDay]=useState<number|null>(null),[query,setQuery]=useState('');
 useEffect(()=>{const update=()=>setNow(new Date());const timer=setInterval(update,60000);const sub=AppState.addEventListener('change',state=>{if(state==='active')update();});return()=>{clearInterval(timer);sub.remove();};},[]);
 const ranked=useMemo(()=>upcomingBirthdays(students,now),[students,now]);
 const todays=ranked.filter(e=>e.daysUntil===0),next=ranked.filter(e=>e.daysUntil>0).slice(0,4);
 const monthEntries=ranked.filter(e=>e.birthday.month===month+1).sort((a,b)=>a.birthday.day-b.birthday.day);
 const term=query.trim().toLocaleLowerCase(locale);
 const shown=(term?ranked:monthEntries).filter(e=>term?(displayName(e.student).toLocaleLowerCase(locale).includes(term)||e.student.Name.toLowerCase().includes(term)):day===null||e.birthday.day===day);
 const counts=new Map<number,number>();monthEntries.forEach(e=>counts.set(e.birthday.day,(counts.get(e.birthday.day)??0)+1));
 const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate(),cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>i>=first&&i<first+days?i-first+1:null);
 const turn=(delta:number)=>{const d=new Date(year,month+delta,1);setMonth(d.getMonth());setYear(d.getFullYear());setDay(null);};
 const caption=[type.caption,{color:c.textSecondary}];
 return <><Stack.Screen options={{headerShown:false}}/><ScreenLayout>
  <NavBar title={s.title}/>
  <AppCard padding={18}><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><Text style={[type.section,{color:c.textPrimary}]}>{s.today}</Text><Icon name="cake-variant-outline" size={28} color={c.primaryInk}/></View>{todays.length?todays.map(entry=><BirthdayRow key={entry.student.Id} entry={entry} relative/>):<Text style={[...caption,{lineHeight:22}]}>{s.todayEmpty}</Text>}</AppCard>
  <IndexTab title={s.upcoming}/><AppCard padding={16}>{next.map(entry=><BirthdayRow key={entry.student.Id} entry={entry} relative/>)}</AppCard>
  <IndexTab title={s.calendar}/><SearchField value={query} onChangeText={setQuery} placeholder={s.search}/>
  {!term?<AppCard padding={12} style={{marginTop:16}}>
   <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
    <Pressable accessibilityRole="button" accessibilityLabel={s.previous} onPress={()=>turn(-1)} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}}><Icon name="chevron-left" size={24} color={c.primaryInk}/></Pressable>
    <Text accessibilityRole="header" style={[type.section,{flex:1,textAlign:'center',color:c.textPrimary}]}>{new Date(year,month,1).toLocaleDateString(locale,{month:'long',year:'numeric'})}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={s.next} onPress={()=>turn(1)} style={{width:48,height:48,alignItems:'center',justifyContent:'center'}}><Icon name="chevron-right" size={24} color={c.primaryInk}/></Pressable>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{flexGrow:1,justifyContent:'center'}}><View style={{width:calendarWidth}}>
   <View style={{flexDirection:'row'}}>{Array.from({length:7},(_,i)=><Text key={i} style={[...caption,{width:'14.2857%',textAlign:'center',paddingVertical:9}]}>{new Date(2026,0,4+i).toLocaleDateString(locale,{weekday:'narrow'})}</Text>)}</View>
   {Array.from({length:cells.length/7},(_,row)=><View key={row} style={{flexDirection:'row'}}>{cells.slice(row*7,row*7+7).map((d,col)=>d===null?<View key={col} style={{width:'14.2857%',minHeight:48}}/>:<Pressable key={col} accessibilityRole="button" accessibilityState={{selected:day===d}} accessibilityLabel={`${new Date(year,month,d).toLocaleDateString(locale)}, ${fmt(s.count,{count:counts.get(d)??0})}`} onPress={()=>setDay(day===d?null:d)} style={{width:'14.2857%',minHeight:48,alignItems:'center',justifyContent:'center',borderWidth:day===d?2:1,borderColor:day===d?c.primaryInk:c.hairline,backgroundColor:day===d?c.primaryA16:c.elevatedBg,borderRadius:3}}><Text style={[type.num,{fontSize:15,color:now.getDate()===d&&now.getMonth()===month&&now.getFullYear()===year?c.primaryInk:c.textPrimary}]}>{d}</Text><View style={{width:4,height:4,marginTop:3,borderRadius:2,backgroundColor:counts.has(d)?c.primaryInk:c.elevatedBg}}/></Pressable>)}</View>)}
   </View></ScrollView>
   <View style={{alignItems:'flex-start',marginTop:12}}><FilterPill label={s.all} selected={day===null} onPress={()=>setDay(null)}/></View>
  </AppCard>:null}
  <AppCard padding={16} style={{marginTop:16}}>{shown.length?shown.map(entry=><BirthdayRow key={entry.student.Id} entry={entry}/>):<EmptyState title={s.empty} body={s.emptyBody}/>}</AppCard>
  <Text style={[...caption,{marginVertical:16}]}>{s.local}</Text><SignalButton variant="ghost" label={s.reminders} icon="bell-outline" onPress={()=>router.push('/reminders' as never)}/><View style={{marginTop:24}}><InlineAd/></View>
 </ScreenLayout></>;
}
