import { FullDataRepository } from '../services/full-data-repository';
import lodash from 'lodash';

type UsingConfigType = 'strategy' | 'resourceAction';

function totalPage(total, pageSize): number {
  return Math.ceil(total / pageSize);
}

const rolesRemoteCollectionsResourcer = {
  name: 'roles.dataSourcesCollections',
  actions: {
    async list(ctx, next) {
      const role = ctx.action.params.associatedIndex;
      const { page = 1, pageSize = 20 } = ctx.action.params;

      const { filter } = ctx.action.params;
      const { dataSourceKey } = filter;

      const dataSource = ctx.app.dataSourceManager.dataSources.get(dataSourceKey);

      const collectionRepository = new FullDataRepository<any>(dataSource.collectionManager.getCollections());

      // all collections
      const [collections, count] = await collectionRepository.findAndCount();

      const filterItem = lodash.get(filter, '$and');
      const filterByTitle = filterItem?.find((item) => item.title);
      const filterByName = filterItem?.find((item) => item.name);

      const filterTitle = lodash.get(filterByTitle, 'title.$includes');
      const filterName = lodash.get(filterByName, 'name.$includes');

      const roleResources = await ctx.app.db.getRepository('dataSourcesRolesResources').find({
        filter: {
          roleName: role,
          dataSourceKey,
        },
      });

      // role collections
      const roleResourcesNames = roleResources.map((roleResource) => roleResource.get('name'));

      const roleResourceActionResourceNames = roleResources
        .filter((roleResources) => roleResources.get('usingActionsConfig'))
        .map((roleResources) => roleResources.get('name'));

      const items = lodash.sortBy(
        collections
          .filter((collection) => {
            return (
              (!filterTitle || lodash.get(collection, 'options.title')?.includes(filterTitle)) &&
              (!filterName || collection.options.name.includes(filterName))
            );
          })
          .map((collection, i) => {
            const collectionName = collection.options.name;
            const exists = roleResourcesNames.includes(collectionName);

            const usingConfig: UsingConfigType = roleResourceActionResourceNames.includes(collectionName)
              ? 'resourceAction'
              : 'strategy';

            return {
              type: 'collection',
              name: collectionName,
              collectionName,
              title: collection.options.uiSchema?.title,
              roleName: role,
              usingConfig,
              exists,
              fields: [...collection.fields.values()].map((field) => {
                return field.options;
              }),
            };
          }),
        'name',
      );

      ctx.body = {
        count,
        rows: items,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPage: totalPage(count, pageSize),
      };

      await next();
    },
  },
};

export { rolesRemoteCollectionsResourcer };