import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '../screens/ChatScreen';
import { CustomerCenterScreen } from '../screens/CustomerCenterScreen';
import { PracticeModeScreen } from '../screens/PracticeModeScreen';
import { PaywallScreen } from '../screens/PaywallScreen';
import { UserProfileScreen } from '../screens/UserProfileScreen';
import { COLORS } from '../utils/constants';
import { FONTS } from '../utils/typography';
import type { RootStackParamList } from '../types';
import { MainTabNavigator } from './MainTabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  userId: string;
  onSignOut: () => void;
}

export function RootNavigator({ userId, onSignOut }: RootNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontFamily: FONTS.header },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Main" options={{ headerShown: false }}>
        {() => <MainTabNavigator userId={userId} onSignOut={onSignOut} />}
      </Stack.Screen>
      <Stack.Screen
        name="Chat"
        options={({ route }) => ({
          title: route.params.otherUserName,
        })}
      >
        {(props) => (
          <ChatScreen
            userId={userId}
            route={props.route}
            otherUserInterests={props.route.params.otherUserInterests}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Paywall"
        options={{ headerShown: false, presentation: 'modal' }}
      >
        {() => <PaywallScreen userId={userId} />}
      </Stack.Screen>
      <Stack.Screen
        name="UserProfile"
        options={{ headerShown: false, presentation: 'modal' }}
      >
        {() => <UserProfileScreen userId={userId} />}
      </Stack.Screen>
      <Stack.Screen
        name="CustomerCenter"
        options={{ title: 'Manage Subscription', presentation: 'modal' }}
      >
        {() => <CustomerCenterScreen userId={userId} />}
      </Stack.Screen>
      <Stack.Screen
        name="PracticeMode"
        options={{ title: 'Practice Mode', presentation: 'modal' }}
      >
        {() => <PracticeModeScreen userId={userId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
