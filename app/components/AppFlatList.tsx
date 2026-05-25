import { forwardRef } from 'react';
import { FlatList, type FlatListProps } from 'react-native';

function AppFlatListInner<ItemT>(
  props: FlatListProps<ItemT>,
  ref: React.Ref<FlatList<ItemT>>,
) {
  return (
    <FlatList
      ref={ref}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      {...props}
    />
  );
}

export const AppFlatList = forwardRef(AppFlatListInner) as <ItemT>(
  props: FlatListProps<ItemT> & { ref?: React.Ref<FlatList<ItemT>> },
) => React.ReactElement;
