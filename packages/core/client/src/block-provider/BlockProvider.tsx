import { css } from '@emotion/css';
import { Field, GeneralField } from '@formily/core';
import { RecursionField, useField, useFieldSchema } from '@formily/react';
import { useRequest } from 'ahooks';
import { Col, Row } from 'antd';
import merge from 'deepmerge';
import template from 'lodash/template';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DataBlockProviderV2,
  TableFieldResource,
  WithoutTableFieldResource,
  useAPIClient,
  useActionContext,
  useDataBlockPropsV2,
  useDataBlockRequestV2,
  useDataBlockResourceV2,
  useDataSourceHeaders,
  useDesignable,
  useRecord,
} from '../';
import { ACLCollectionProvider } from '../acl/ACLProvider';
import { CollectionProvider, useCollection, useCollectionManager } from '../collection-manager';
import { DataBlockCollector } from '../filter-provider/FilterProvider';
import { useRecordIndex } from '../record-provider';
import { useTemplateBlockContext } from './TemplateBlockProvider';
import { useAssociationNames } from './hooks';
import { useDataBlockSourceId } from './hooks/useDataBlockSourceId';

/**
 * @deprecated
 */
export const BlockResourceContext = createContext(null);
export const BlockAssociationContext = createContext(null);

/**
 * @deprecated
 */
export const BlockRequestContext = createContext<{
  block?: string;
  props?: any;
  field?: GeneralField;
  service?: any;
  resource?: any;
  allowedActions?: any;
  __parent?: any;
  updateAssociationValues?: any[];
}>({});

export const useBlockResource = () => {
  const resource = useDataBlockResourceV2();
  return useContext(BlockResourceContext) || resource;
};

interface UseResourceProps {
  resource: any;
  association?: any;
  useSourceId?: any;
  collection?: any;
  dataSource?: any;
  block?: any;
}

const useAssociation = (props) => {
  const { association } = props;
  const { getCollectionField } = useCollectionManager();
  if (typeof association === 'string') {
    return getCollectionField(association);
  } else if (association?.collectionName && association?.name) {
    return getCollectionField(`${association?.collectionName}.${association?.name}`);
  }
};

const useResource = (props: UseResourceProps) => {
  const { block, collection, dataSource, resource, useSourceId } = props;
  const record = useRecord();
  const api = useAPIClient();
  const { fieldSchema } = useActionContext();
  const isCreateAction = fieldSchema?.['x-action'] === 'create';
  const association = useAssociation(props);
  const sourceId = useSourceId?.();
  const field = useField();
  const withoutTableFieldResource = useContext(WithoutTableFieldResource);
  const __parent = useBlockRequestContext();
  const headers = useDataSourceHeaders(dataSource);

  if (block === 'TableField') {
    const options = {
      field,
      api,
      resource,
      sourceId: !isCreateAction
        ? sourceId || record[association?.sourceKey || 'id'] || record?.__parent?.[association?.sourceKey || 'id']
        : undefined,
    };
    return new TableFieldResource(options);
  }

  if (
    !withoutTableFieldResource &&
    __parent?.block === 'TableField' &&
    __parent?.resource instanceof TableFieldResource
  ) {
    return __parent.resource;
  }
  if (!association) {
    return api.resource(resource, undefined, headers);
  }
  if (sourceId) {
    return api.resource(resource, sourceId, headers);
  }
  if (record?.__parent?.[association?.sourceKey || 'id']) {
    return api.resource(resource, record.__parent[association?.sourceKey || 'id'], headers);
  }
  if (record?.[association?.sourceKey || 'id']) {
    return api.resource(resource, record[association?.sourceKey || 'id'], headers);
  }
  return api.resource(collection, undefined, headers);
};

const useActionParams = (props) => {
  const { useParams } = props;
  const params = useParams?.() || {};
  return { ...props.params, ...params };
};

const useResourceAction = (props, opts = {}) => {
  /**
   * fieldName: 来自 TableFieldProvider
   */
  const { resource, action, fieldName: tableFieldName, runWhenParamsChanged = false } = props;
  const { fields } = useCollection();
  const params = useActionParams(props);
  const api = useAPIClient();
  const fieldSchema = useFieldSchema();
  const { snapshot } = useActionContext();
  const { templateFinshed } = useTemplateBlockContext();
  const record = useRecord();
  const isTemplate = fieldSchema['x-template-key'];
  if (!Reflect.has(params, 'appends')) {
    const appends = fields?.filter((field) => field.target).map((field) => field.name);
    if (appends?.length) {
      params['appends'] = appends;
    }
  }
  const result = useRequest(
    snapshot
      ? async () => ({
          data: record[tableFieldName] ?? [],
        })
      : (opts) => {
          if (!action || (isTemplate && !templateFinshed)) {
            return Promise.resolve({});
          }
          const actionParams = { ...params, ...opts };
          if (params?.appends) {
            actionParams.appends = params.appends;
          }
          return resource[action](actionParams).then((res) => res.data);
        },
    {
      ...opts,
      onSuccess(data, params) {
        opts?.['onSuccess']?.(data, params);
        if (fieldSchema['x-uid']) {
          api.services[fieldSchema['x-uid']] = result;
        }
      },
      defaultParams: [params],
      refreshDeps: [runWhenParamsChanged ? null : JSON.stringify(params.appends), templateFinshed],
    },
  );
  // automatic run service when params has changed
  const firstRun = useRef(false);
  useEffect(() => {
    if (!runWhenParamsChanged) {
      return;
    }
    if (firstRun.current) {
      result?.run({ ...result?.params?.[0], ...params });
    }
    firstRun.current = true;
  }, [JSON.stringify(params), runWhenParamsChanged]);

  return result;
};

export const MaybeCollectionProvider = (props) => {
  const { collection } = props;
  return collection ? (
    <CollectionProvider collection={collection}>
      <ACLCollectionProvider>{props.children}</ACLCollectionProvider>
    </CollectionProvider>
  ) : (
    props.children
  );
};

/**
 * @deprecated
 * @param props
 * @returns
 */
export const BlockRequestProvider = (props) => {
  const field = useField<Field>();
  const resource = useDataBlockResourceV2();
  const [allowedActions, setAllowedActions] = useState({});
  const service = useDataBlockRequestV2();

  // Infinite scroll support
  const serviceAllowedActions = (service?.data as any)?.meta?.allowedActions;
  useEffect(() => {
    if (!serviceAllowedActions) return;
    setAllowedActions((last) => {
      return merge(last, serviceAllowedActions ?? {});
    });
  }, [serviceAllowedActions]);

  const __parent = useBlockRequestContext();
  return (
    <BlockRequestContext.Provider
      value={{
        allowedActions,
        block: props.block,
        props,
        field,
        service,
        resource,
        __parent,
        updateAssociationValues: props?.updateAssociationValues || [],
      }}
    >
      {props.children}
    </BlockRequestContext.Provider>
  );
};

/**
 * @deprecated
 */
export const useBlockRequestContext = () => {
  return useContext(BlockRequestContext);
};

export const RenderChildrenWithAssociationFilter: React.FC<any> = (props) => {
  const fieldSchema = useFieldSchema();
  const { findComponent } = useDesignable();
  const field = useField();
  const Component = findComponent(field.component?.[0]) || React.Fragment;
  const associationFilterSchema = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'AssociationFilter') {
      return s;
    }
    return buf;
  }, null);

  if (associationFilterSchema) {
    return (
      <Component {...field.componentProps}>
        <Row
          className={css`
            height: 100%;
          `}
          gutter={16}
          wrap={false}
        >
          <Col
            className={css`
              width: 200px;
              flex: 0 0 auto;
            `}
            style={props.associationFilterStyle}
          >
            <RecursionField
              schema={fieldSchema}
              onlyRenderProperties
              filterProperties={(s) => s['x-component'] === 'AssociationFilter'}
            />
          </Col>
          <Col
            className={css`
              flex: 1 1 auto;
              min-width: 0;
            `}
          >
            <div
              className={css`
                display: flex;
                flex-direction: column;
                height: 100%;
              `}
            >
              <RecursionField
                schema={fieldSchema}
                onlyRenderProperties
                filterProperties={(s) => s['x-component'] !== 'AssociationFilter'}
              />
            </div>
          </Col>
        </Row>
      </Component>
    );
  }
  return props.children;
};

const BlockContext = createContext<{
  /** 用以区分区块的标识 */
  name: string;
}>(null);

export const useBlockContext = () => {
  return useContext(BlockContext);
};

export const BlockProvider = (props: {
  name: string;
  resource: any;
  collection?: any;
  association?: any;
  dataSource?: string;
  params?: any;
  children?: any;
  /** @deprecated */
  useSourceId?: any;
  /** @deprecated */
  useParams?: any;
}) => {
  const { name, dataSource, association, useSourceId, useParams } = props;
  const sourceId = useDataBlockSourceId({ association, useSourceId });
  const paramsFromHook = useParams?.();
  const { getAssociationAppends } = useAssociationNames(dataSource);
  const { appends, updateAssociationValues } = getAssociationAppends();
  const params = useMemo(() => {
    if (!props.params?.['appends']) {
      return { ...props.params, appends, ...paramsFromHook };
    }
    return { ...props.params, ...paramsFromHook };
  }, [appends, paramsFromHook, props.params]);
  const blockValue = useMemo(() => ({ name }), [name]);

  return (
    <BlockContext.Provider value={blockValue}>
      <DataBlockProviderV2 {...(props as any)} params={params} sourceId={sourceId}>
        <BlockRequestProvider {...props} updateAssociationValues={updateAssociationValues} params={params}>
          <DataBlockCollector {...props} params={params}>
            {props.children}
          </DataBlockCollector>
        </BlockRequestProvider>
      </DataBlockProviderV2>
    </BlockContext.Provider>
  );
};

export const useBlockAssociationContext = () => {
  const { association } = useDataBlockPropsV2();
  return useContext(BlockAssociationContext) || association;
};

export const useFilterByTk = () => {
  const { resource, __parent } = useBlockRequestContext();
  const recordIndex = useRecordIndex();
  const record = useRecord();
  const collection = useCollection();
  const { getCollectionField } = useCollectionManager();
  const assoc = useBlockAssociationContext();
  const withoutTableFieldResource = useContext(WithoutTableFieldResource);
  if (!withoutTableFieldResource) {
    if (resource instanceof TableFieldResource || __parent?.block === 'TableField') {
      return recordIndex;
    }
  }

  if (assoc) {
    const association = getCollectionField(assoc);
    return record?.[association.targetKey || 'id'];
  }
  return record?.[collection.filterTargetKey || 'id'];
};

export const useSourceIdFromRecord = () => {
  const record = useRecord();
  const { getCollectionField } = useCollectionManager();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    return record?.[collectionField.sourceKey || 'id'];
  }
};

export const useSourceIdFromParentRecord = () => {
  const record = useRecord();
  const { getCollectionField } = useCollectionManager();
  const association = useBlockAssociationContext();
  if (association) {
    const collectionField = getCollectionField(association);
    return record?.__parent?.[collectionField.sourceKey || 'id'];
  }
};

export const useParamsFromRecord = () => {
  const filterByTk = useFilterByTk();
  const record = useRecord();
  const { fields } = useCollection();
  const fieldSchema = useFieldSchema();
  const { getCollectionJoinField } = useCollectionManager();
  const collectionField = getCollectionJoinField(fieldSchema?.['x-decorator-props']?.resource);
  const filterFields = fields
    .filter((v) => {
      return ['boolean', 'date', 'integer', 'radio', 'sort', 'string', 'time', 'uid', 'uuid'].includes(v.type);
    })
    .map((v) => v.name);
  const filter = Object.keys(record)
    .filter((key) => filterFields.includes(key))
    .reduce((result, key) => {
      result[key] = record[key];
      return result;
    }, {});

  const obj = {
    filterByTk: filterByTk,
  };
  if (record.__collection && !['oho', 'm2o', 'obo'].includes(collectionField?.interface)) {
    obj['targetCollection'] = record.__collection;
  }
  if (!filterByTk) {
    obj['filter'] = filter;
  }
  return obj;
};

export const RecordLink = (props) => {
  const field = useField();
  const record = useRecord();
  const { title, to, ...others } = props;
  const compiled = template(to || '');
  return (
    <Link {...others} to={compiled({ record: record || {} })}>
      {field.title}
    </Link>
  );
};
