import { useField, useFieldSchema } from '@formily/react';
import { useCollectionManager } from '../../collection-manager';
import { useColumnSchema } from '../../schema-component/antd/table-v2/Table.Column.Decorator';

/**
 * 是否显示 `允许多选` 开关
 */
export function useIsShowMultipleSwitch() {
  const field = useField();
  const { fieldSchema: tableColumnSchema } = useColumnSchema();
  const schema = useFieldSchema();
  const fieldSchema = tableColumnSchema || schema;
  const { getCollectionField } = useCollectionManager();

  const collectionField = fieldSchema['x-collection-field']
    ? getCollectionField(fieldSchema['x-collection-field'])
    : null;
  const uiSchema = collectionField?.uiSchema || fieldSchema;
  const hasMultiple = uiSchema['x-component-props']?.multiple === true;
  const fieldMode = field?.componentProps?.['mode'];
  return function IsShowMultipleSwitch() {
    return !field.readPretty && fieldSchema['x-component'] !== 'TableField' && hasMultiple && fieldMode !== 'SubTable';
  };
}
