import { TextInput as RNTextInput, TextInputProps, StyleSheet } from 'react-native';
import { useThemeColor } from './Themed';

export function TextInput(props: TextInputProps) {
  const { style, ...otherProps } = props;
  const backgroundColor = useThemeColor({}, 'background');
  const color = useThemeColor({}, 'text');

  return (
    <RNTextInput
      style={[
        styles.input,
        { backgroundColor, color },
        style,
      ]}
      placeholderTextColor="#666"
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
});
