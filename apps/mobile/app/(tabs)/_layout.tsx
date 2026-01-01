import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/lib/auth/auth-provider';
import { LoadingScreen } from '@/components/common';

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          headerTitle: 'Glint',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="library" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

interface TabIconProps {
  name: 'chat' | 'library' | 'settings';
  color: string;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps) {
  const icons: Record<string, string> = {
    chat: 'C',
    library: 'L',
    settings: 'S',
  };

  return (
    <View style={[styles.iconContainer, { width: size, height: size }]}>
      <Text style={[styles.iconText, { color, fontSize: size * 0.6 }]}>
        {icons[name]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 56,
    paddingBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 18,
    color: '#111827',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  iconText: {
    fontWeight: '700',
  },
});
