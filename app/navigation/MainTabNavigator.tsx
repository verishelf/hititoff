import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { GlassTabBarBackground, IOS_TAB_BAR_INSET } from '../components/GlassTabBarBackground';
import { HomeScreen } from '../screens/HomeScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SwipeScreen } from '../screens/SwipeScreen';
import { COLORS } from '../utils/constants';
import { hapticSelection } from '../utils/haptics';
import type { MainTabParamList } from '../types';

interface MainTabNavigatorProps {
  userId: string;
  onSignOut: () => void;
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator({ userId, onSignOut }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenListeners={{
        tabPress: () => {
          hapticSelection();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarBackground: () => <GlassTabBarBackground />,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            borderWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            shadowRadius: 0,
            height: 84,
            paddingTop: 0,
          },
          default: {
            backgroundColor: COLORS.surface,
            borderTopWidth: 0,
            borderWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            shadowRadius: 0,
            height: 60,
            paddingBottom: 4,
            paddingTop: 0,
          },
        }),
        sceneStyle: {
          backgroundColor: COLORS.background,
          ...(Platform.OS === 'ios' ? { paddingBottom: IOS_TAB_BAR_INSET } : {}),
        },
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      >
        {() => <HomeScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Swipe"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />
          ),
        }}
      >
        {() => <SwipeScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Matches"
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      >
        {() => <MatchesScreen userId={userId} />}
      </Tab.Screen>
      <Tab.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      >
        {() => <ProfileScreen userId={userId} onSignOut={onSignOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
