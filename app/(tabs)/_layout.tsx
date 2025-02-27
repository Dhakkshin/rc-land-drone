import { Tabs } from 'expo-router';
import { useThemeColor } from '@/components/Themed';
import { TabBarIcon } from '@/components/TabBarIcon';

export default function TabLayout() {
  const tabBarBackground = useThemeColor({}, 'tabBarBackground');

  return (
    <Tabs
      screenOptions={{
        tabBarBackground: () => <></>,
        tabBarStyle: { 
          backgroundColor: tabBarBackground,
          elevation: 0,
          borderTopWidth: 0,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="connection"
        options={{
          title: 'Connection',
          tabBarIcon: ({ color }) => <TabBarIcon name="wifi" color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Control',
          tabBarIcon: ({ color }) => <TabBarIcon name="game-controller" color={color} />,
        }}
      />
    </Tabs>
  );
}
