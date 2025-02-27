import { useColorScheme } from 'react-native';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'text' | 'background' | 'tabBarBackground'
) {
  const theme = useColorScheme() ?? 'light';
  const colorMap = {
    light: {
      text: '#000',
      background: '#fff',
      tabBarBackground: '#f8f8f8',
    },
    dark: {
      text: '#fff',
      background: '#000',
      tabBarBackground: '#1c1c1c',
    },
  };

  if (props[theme]) {
    return props[theme];
  }
  return colorMap[theme][colorName];
}
