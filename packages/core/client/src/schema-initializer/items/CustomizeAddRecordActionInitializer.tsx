import React from 'react';
import { useSchemaInitializerItem } from '../../application';
import { BlockInitializer } from './BlockInitializer';

export const CustomizeAddRecordActionInitializer = () => {
  const schema = {
    type: 'void',
    title: '{{t("Add record")}}',
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:customize:addRecord',
    'x-component': 'Action',
    'x-action': 'customize:create',
    'x-component-props': {
      openMode: 'drawer',
      icon: 'PlusOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{t("Add record")}}',
        'x-component': 'Action.Container',
        'x-component-props': {
          className: 'nb-action-popup',
        },
        properties: {
          tabs: {
            type: 'void',
            'x-component': 'Tabs',
            'x-component-props': {},
            'x-initializer': 'TabPaneInitializersForCreateFormBlock',
            'x-initializer-props': {
              gridInitializer: 'CusomeizeCreateFormBlockInitializers',
            },
            properties: {
              tab1: {
                type: 'void',
                title: '{{t("Add record")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'CusomeizeCreateFormBlockInitializers',
                    properties: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  const itemConfig = useSchemaInitializerItem();

  return <BlockInitializer {...itemConfig} schema={schema} item={itemConfig} />;
};
