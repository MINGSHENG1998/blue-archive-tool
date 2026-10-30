import { router, Stack } from 'expo-router';
import { Text, View } from 'react-native';
import { AppCard, HaloMark, ScreenLayout, SignalButton, Stamp } from '@/components/schale';
import { useStrings } from '@/constants/strings/define';
import { notFoundStrings } from '@/constants/strings/notFound';
import { useType } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

export default function NotFoundScreen() {
 const c=useColors(), type=useType(), s=useStrings(notFoundStrings);
 return <><Stack.Screen options={{headerShown:false}}/><ScreenLayout title={s.title}>
  <AppCard padding={24}>
   <View style={{alignItems:'center',paddingVertical:28,gap:20}}><HaloMark size={90}/><Text style={[type.numXL,{fontSize:88,color:c.primaryInk}]}>404</Text><Stamp label={s.status} tone="hazard"/></View>
   <Text style={[type.body,{color:c.textSecondary,marginBottom:24,textAlign:'center'}]}>{s.body}</Text>
   <SignalButton label={s.home} icon="home-outline" onPress={()=>router.replace('/')}/>
   <SignalButton style={{marginTop:12}} variant="ghost" label={s.sensei} onPress={()=>router.replace('/(tabs)/other')}/>
  </AppCard>
 </ScreenLayout></>;
}
