import { mockServer, MockServer } from '@nocobase/test';
import path from 'path';

describe('duplicator api', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    app.plugin(require('../server').default, { name: 'duplicator' });
    app.plugin('error-handler');
    app.plugin('collection-manager');
    await app.loadAndInstall({ clean: true });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get collection groups', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        title: '测试Collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('collections').create({
      values: {
        name: 'child_collection',
        title: 'child collection',
        inherits: 'test_collection',
        fields: [
          {
            name: 'child_field',
            type: 'string',
          },
          {
            name: 'childRelation',
            type: 'belongsTo',
            target: 'test_collection',
          },
        ],
      },
      context: {},
    });

    const collectionGroupsResponse = await app.agent().resource('duplicator').dumpableCollections();
    expect(collectionGroupsResponse.status).toBe(200);

    const data = collectionGroupsResponse.body;

    expect(data['requiredGroups']).toBeTruthy();
    const requiredGroup = data['requiredGroups'][0];
    const collections = requiredGroup['collections'];
    const firstCollection = collections[0];
    expect(typeof firstCollection).toBe('object');
    expect(firstCollection['name']).toBeTruthy();
    expect(firstCollection['title']).toBeTruthy();

    expect(data['optionalGroups']).toBeTruthy();
    expect(data['userCollections']).toBeTruthy();
    const childCollection = data['userCollections'].find((collection) => collection['name'] === 'child_collection');

    const belongsToField = childCollection['fields'].find((field) => field['name'] === 'childRelation');
    expect(belongsToField['target']).toBe('test_collection');

    console.log(JSON.stringify(data, null, 2));
  });

  it('should request dump api', async () => {
    const dumpResponse = await app.agent().post('/duplicator:dump').send({
      groups: [],
      collections: [],
    });

    expect(dumpResponse.status).toBe(200);
  });

  it('should request restore api', async () => {
    const packageInfoResponse = await app
      .agent()
      .post('/duplicator:uploadFile')
      .attach('file', path.resolve(__dirname, './fixtures/dump.nbdump.fixture'));

    console.log(JSON.stringify(packageInfoResponse.body, null, 2));
    expect(packageInfoResponse.status).toBe(200);
    const data = packageInfoResponse.body.data;

    expect(data['key']).toBeTruthy();
    expect(data['meta']).toBeTruthy();

    const restoreResponse = await app.agent().post('/duplicator:restore').send({
      restoreKey: data['key'],
      selectedOptionalGroups: [],
      selectedUserCollections: [],
    });

    expect(restoreResponse.status).toBe(200);
  });
});
