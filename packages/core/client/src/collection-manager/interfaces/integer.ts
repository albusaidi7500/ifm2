import { registerValidateFormats } from '@formily/core';
import { i18n } from '../../i18n';
import { defaultProps, operators, unique } from './properties';
import { IField } from './types';
import { CollectionFieldInterface } from '../../data-source/collection-field-interface/CollectionFieldInterface';

registerValidateFormats({
  odd: /^-?\d*[13579]$/,
  even: /^-?\d*[02468]$/,
});

export const integer: IField = {
  name: 'integer',
  type: 'object',
  group: 'basic',
  order: 6,
  title: '{{t("Integer")}}',
  sortable: true,
  default: {
    type: 'bigInt',
    // name,
    uiSchema: {
      type: 'number',
      // title,
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  },
  availableTypes: ['bigInt', 'integer'],
  hasDefaultValue: true,
  properties: {
    ...defaultProps,
    unique,
  },
  filterable: {
    operators: operators.number,
  },
  titleUsable: true,
  validateSchema(fieldSchema) {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.minimum').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Maximum must greater than minimum',
            )}' : ''
        }}}`,
      },
      minimum: {
        type: 'number',
        title: '{{ t("Minimum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.maximum'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Minimum must less than maximum',
              )}' : ''}}`,
            },
          },
        },
      },
      format: {
        type: 'string',
        title: '{{ t("Format") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [
          {
            label: '{{ t("Odd") }}',
            value: 'odd',
          },
          {
            label: '{{ t("Even") }}',
            value: 'even',
          },
        ],
      },
      pattern: {
        type: 'string',
        title: '{{ t("Regular expression") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        },
      },
    };
  },
};

export class IntegerFieldInterface extends CollectionFieldInterface {
  name = 'integer';
  type = 'object';
  group = 'basic';
  order = 6;
  title = '{{t("Integer")}}';
  sortable = true;
  default = {
    type: 'bigInt',
    uiSchema: {
      type: 'number',
      'x-component': 'InputNumber',
      'x-component-props': {
        stringMode: true,
        step: '1',
      },
      'x-validator': 'integer',
    },
  };
  availableTypes = ['bigInt', 'integer'];
  hasDefaultValue = true;
  properties = {
    ...defaultProps,
    unique,
  };
  filterable = {
    operators: operators.number,
  };
  titleUsable = true;
  validateSchema = (fieldSchema) => {
    return {
      maximum: {
        type: 'number',
        title: '{{ t("Maximum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': `{{(field) => {
          const targetValue = field.query('.minimum').value();
          field.selfErrors =
            !!targetValue && !!field.value && targetValue > field.value ? '${i18n.t(
              'Maximum must greater than minimum',
            )}' : ''
        }}}`,
      },
      minimum: {
        type: 'number',
        title: '{{ t("Minimum") }}',
        'x-decorator': 'FormItem',
        'x-component': 'InputNumber',
        'x-component-props': {
          precision: 0,
        },
        'x-reactions': {
          dependencies: ['.maximum'],
          fulfill: {
            state: {
              selfErrors: `{{!!$deps[0] && !!$self.value && $deps[0] < $self.value ? '${i18n.t(
                'Minimum must less than maximum',
              )}' : ''}}`,
            },
          },
        },
      },
      format: {
        type: 'string',
        title: '{{ t("Format") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Select',
        'x-component-props': {
          allowClear: true,
        },
        enum: [
          {
            label: '{{ t("Odd") }}',
            value: 'odd',
          },
          {
            label: '{{ t("Even") }}',
            value: 'even',
          },
        ],
      },
      pattern: {
        type: 'string',
        title: '{{ t("Regular expression") }}',
        'x-decorator': 'FormItem',
        'x-component': 'Input',
        'x-component-props': {
          prefix: '/',
          suffix: '/',
        },
      },
    };
  };
}
