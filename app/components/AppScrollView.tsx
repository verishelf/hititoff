import { ScrollView, type ScrollViewProps } from 'react-native';

export function AppScrollView(props: ScrollViewProps) {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    />
  );
}
