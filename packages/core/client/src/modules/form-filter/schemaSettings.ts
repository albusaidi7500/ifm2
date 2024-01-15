import { ArrayCollapse, FormLayout } from '@formily/antd-v5';
import { Field } from '@formily/core';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../application';
import { SchemaSettings } from '../../application/schema-settings/SchemaSettings';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { FilterBlockType } from '../../filter-provider';
import { EditOperator, useDesignable, useValidateSchema } from '../../schema-component';
import {
  SchemaSettingsBlockTitleItem,
  SchemaSettingsConnectDataBlocks,
  SchemaSettingsFormItemTemplate,
  SchemaSettingsLinkageRules,
} from '../../schema-settings';
import { useFieldComponentName } from '../form-creation/schemaSettings';

export const filterFormBlockSettings = new SchemaSettings({
  name: 'filterFormBlockSettings',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'formItemTemplate',
      Component: SchemaSettingsFormItemTemplate,
      useComponentProps() {
        const { name } = useCollection();
        const fieldSchema = useFieldSchema();
        const defaultResource = fieldSchema?.['x-decorator-props']?.resource;
        return {
          componentName: 'FilterFormItem',
          collectionName: name,
          resourceName: defaultResource,
        };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { name } = useCollection();
        return {
          collectionName: name,
        };
      },
    },
    {
      name: 'connectDataBlocks',
      Component: SchemaSettingsConnectDataBlocks,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          type: FilterBlockType.FORM,
          emptyDescription: t('No blocks to connect'),
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        removeParentsIfNoChildren: true,
        breakRemoveOn: {
          'x-component': 'Grid',
        },
      },
    },
  ],
});

export const filterFormItemFieldSettings = new SchemaSettings({
  name: 'fieldSettings:FilterFormItem',
  items: [
    {
      name: 'builtInOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Built-in options',
      },
      useChildren() {
        return [
          {
            name: 'editFieldTitle',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

              return {
                title: t('Edit field title'),
                schema: {
                  type: 'object',
                  title: t('Edit field title'),
                  properties: {
                    title: {
                      title: t('Field title'),
                      default: field?.title,
                      description: `${t('Original field title: ')}${collectionField?.uiSchema?.title}`,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ title }) {
                  if (title) {
                    field.title = title;
                    fieldSchema.title = title;
                    dn.emit('patch', {
                      schema: {
                        'x-uid': fieldSchema['x-uid'],
                        title: fieldSchema.title,
                      },
                    });
                  }
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'displayTitle',
            type: 'switch',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Display title'),
                checked: fieldSchema['x-decorator-props']?.['showTitle'] ?? true,
                onChange(checked) {
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['showTitle'] = checked;
                  field.decoratorProps.showTitle = checked;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': {
                        ...fieldSchema['x-decorator-props'],
                        showTitle: checked,
                      },
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'editDescription',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Edit description'),
                schema: {
                  type: 'object',
                  title: t('Edit description'),
                  properties: {
                    description: {
                      // title: t('Description'),
                      default: field?.description,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ description }) {
                  field.description = description;
                  fieldSchema.description = description;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      description: fieldSchema.description,
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'editTooltip',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const { dn } = useDesignable();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();

              return {
                title: t('Edit tooltip'),
                schema: {
                  type: 'object',
                  title: t('Edit tooltip'),
                  properties: {
                    tooltip: {
                      default: fieldSchema?.['x-decorator-props']?.tooltip,
                      'x-decorator': 'FormItem',
                      'x-component': 'Input.TextArea',
                      'x-component-props': {},
                    },
                  },
                } as ISchema,
                onSubmit({ tooltip }) {
                  field.decoratorProps.tooltip = tooltip;
                  fieldSchema['x-decorator-props'] = fieldSchema['x-decorator-props'] || {};
                  fieldSchema['x-decorator-props']['tooltip'] = tooltip;
                  dn.emit('patch', {
                    schema: {
                      'x-uid': fieldSchema['x-uid'],
                      'x-decorator-props': fieldSchema['x-decorator-props'],
                    },
                  });
                  dn.refresh();
                },
              };
            },
          },
          {
            name: 'setValidationRules',
            type: 'modal',
            useComponentProps() {
              const { t } = useTranslation();
              const field = useField<Field>();
              const fieldSchema = useFieldSchema();
              const { dn, refresh } = useDesignable();
              const validateSchema = useValidateSchema();
              const { getCollectionJoinField } = useCollectionManager();
              const { getField } = useCollection();
              const collectionField =
                getField(fieldSchema['name']) || getCollectionJoinField(fieldSchema['x-collection-field']);

              return {
                title: t('Set validation rules'),
                components: { ArrayCollapse, FormLayout },
                schema: {
                  type: 'object',
                  title: t('Set validation rules'),
                  properties: {
                    rules: {
                      type: 'array',
                      default: fieldSchema?.['x-validator'],
                      'x-component': 'ArrayCollapse',
                      'x-decorator': 'FormItem',
                      'x-component-props': {
                        accordion: true,
                      },
                      maxItems: 3,
                      items: {
                        type: 'object',
                        'x-component': 'ArrayCollapse.CollapsePanel',
                        'x-component-props': {
                          header: '{{ t("Validation rule") }}',
                        },
                        properties: {
                          index: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.Index',
                          },
                          layout: {
                            type: 'void',
                            'x-component': 'FormLayout',
                            'x-component-props': {
                              labelStyle: {
                                marginTop: '6px',
                              },
                              labelCol: 8,
                              wrapperCol: 16,
                            },
                            properties: {
                              ...validateSchema,
                              message: {
                                type: 'string',
                                title: '{{ t("Error message") }}',
                                'x-decorator': 'FormItem',
                                'x-component': 'Input.TextArea',
                                'x-component-props': {
                                  autoSize: {
                                    minRows: 2,
                                    maxRows: 2,
                                  },
                                },
                              },
                            },
                          },
                          remove: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.Remove',
                          },
                          moveUp: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.MoveUp',
                          },
                          moveDown: {
                            type: 'void',
                            'x-component': 'ArrayCollapse.MoveDown',
                          },
                        },
                      },
                      properties: {
                        add: {
                          type: 'void',
                          title: '{{ t("Add validation rule") }}',
                          'x-component': 'ArrayCollapse.Addition',
                          'x-reactions': {
                            dependencies: ['rules'],
                            fulfill: {
                              state: {
                                disabled: '{{$deps[0].length >= 3}}',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                } as ISchema,
                onSubmit(v) {
                  const rules = [];
                  for (const rule of v.rules) {
                    rules.push(_.pickBy(rule, _.identity));
                  }
                  const schema = {
                    ['x-uid']: fieldSchema['x-uid'],
                  };
                  if (['percent'].includes(collectionField?.interface)) {
                    for (const rule of rules) {
                      if (!!rule.maxValue || !!rule.minValue) {
                        rule['percentMode'] = true;
                      }

                      if (rule.percentFormat) {
                        rule['percentFormats'] = true;
                      }
                    }
                  }
                  const concatValidator = _.concat([], collectionField?.uiSchema?.['x-validator'] || [], rules);
                  field.validator = concatValidator;
                  fieldSchema['x-validator'] = rules;
                  schema['x-validator'] = rules;
                  dn.emit('patch', {
                    schema,
                  });
                  refresh();
                },
              };
            },
            useVisible() {
              const validateSchema = useValidateSchema();
              return !!validateSchema;
            },
          },
          {
            name: 'operator',
            Component: EditOperator,
          },
        ];
      },
    },
    {
      name: 'decoratorOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Decorator options',
      },
      useChildren() {
        return [];
      },
    },
    {
      name: 'componentOptions',
      type: 'itemGroup',
      componentProps: {
        title: 'Component options',
      },
      useChildren() {
        const app = useApp();
        const fieldComponentName = useFieldComponentName();
        const componentSettings = app.schemaSettingsManager.get(`fieldSettings:component:${fieldComponentName}`);
        return componentSettings?.items || [];
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'remove',
      sort: 100,
      useComponentProps() {
        const { t } = useTranslation();

        return {
          removeParentsIfNoChildren: true,
          confirm: {
            title: t('Delete field'),
          },
          breakRemoveOn: {
            'x-component': 'Grid',
          },
        };
      },
    },
  ],
});
