import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {requestPermission,reconcile} from '../native';
import {APP_PREFIX} from '../planner';
beforeEach(()=>jest.clearAllMocks());
test('creates the Android channel before the explicit permission request',async()=>{
 const os=Platform.OS;
 Object.defineProperty(Platform,'OS',{configurable:true,value:'android'});
 try {
 (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({granted:false,status:'undetermined',canAskAgain:true}).mockResolvedValueOnce({granted:true,status:'granted'});
 expect(await requestPermission('en')).toBe('granted');
 expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('schale-reminders',expect.any(Object));
 expect((Notifications.setNotificationChannelAsync as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((Notifications.requestPermissionsAsync as jest.Mock).mock.invocationCallOrder[0]);
 } finally { Object.defineProperty(Platform,'OS',{configurable:true,value:os}); }
});
test('schedules localized one-shot requests with the stable id and channel',async()=>{
 const at=Date.now()+60000,id=`${APP_PREFIX}apFull:current`;
 await reconcile([{id,at,kind:'apFull',route:'/tools/ap',name:'',signature:'stable'}],'ja');
 expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({identifier:id,content:expect.objectContaining({title:'APが全回復しました',data:{route:'/tools/ap',signature:'stable:ja'}}),trigger:expect.objectContaining({date:at,channelId:'schale-reminders'})}));
});
