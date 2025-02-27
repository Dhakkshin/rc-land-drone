import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

export function TabBarIcon(props: TabBarIconProps) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />;
}
