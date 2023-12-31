import * as request from 'supertest';
import FireFly, { FireFlyDatatypeResponse } from '@hyperledger/firefly-sdk';
import server from '../src/server';
import { getFireflyClient } from '../src/clients/fireflySDKWrapper';
import { DatatypeInterface } from '../src/interfaces';
const firefly = getFireflyClient();
jest.mock('@hyperledger/firefly-sdk');
const mockFireFly = firefly as jest.MockedObject<FireFly>;

const SAMPLE_SCHEMA = {
  $id: 'https://example.com/widget.schema.json',
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Widget',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      description: 'The unique identifier for the widget.',
    },
    name: {
      type: 'string',
      description: "The person's last name.",
    },
  },
};
const baseDatatypeRes = {
  id: 'datatype1',
  validator: 'json',
  value: JSON.stringify(SAMPLE_SCHEMA),
  created: '4/18/2022',
  hash: '0x123',
  message: 'abc-def',
  namespace: 'default',
};

describe('Datatypes', () => {
  test('Create a datatype', async () => {
    const req = {
      name: 'my-datatype',
      version: '1.0',
      schema: SAMPLE_SCHEMA,
    } as DatatypeInterface;

    const datatypeResponse = {
      name: 'my-datatype',
      version: '1.0',
      id: 'datatype1',
      ...baseDatatypeRes,
    } as FireFlyDatatypeResponse;

    mockFireFly.createDatatype.mockResolvedValueOnce(datatypeResponse);

    await request(server)
      .post('/api/datatypes')
      .send(req)
      .expect(202)
      .expect({ type: 'datatype', id: 'datatype1' });

    expect(mockFireFly.createDatatype).toHaveBeenCalledWith({
      name: 'my-datatype',
      version: '1.0',
      value: SAMPLE_SCHEMA,
    });
  });

  test('Get datatypes', async () => {
    const req = [
      {
        name: 'my-datatype',
        version: '1.0',
        ...baseDatatypeRes,
      },
      {
        name: 'my-datatype-2',
        version: '2.0',
        ...baseDatatypeRes,
      },
    ] as FireFlyDatatypeResponse[];

    mockFireFly.getDatatypes.mockResolvedValueOnce(req);

    await request(server)
      .get('/api/datatypes')
      .expect(200)
      .expect([
        {
          id: 'datatype1',
          name: 'my-datatype',
          version: '1.0',
          schema: JSON.stringify(SAMPLE_SCHEMA),
        },
        {
          id: 'datatype1',
          name: 'my-datatype-2',
          version: '2.0',
          schema: JSON.stringify(SAMPLE_SCHEMA),
        },
      ]);
  });

  test('Get datatype by name and version', async () => {
    const req = {
      name: 'my-datatype',
      version: '1.0',
      ...baseDatatypeRes,
    } as FireFlyDatatypeResponse;

    mockFireFly.getDatatype.mockResolvedValueOnce(req);

    await request(server)
      .get('/api/datatypes/my-datatype/1.0')
      .expect(200)
      .expect({
        id: 'datatype1',
        name: 'my-datatype',
        version: '1.0',
        schema: JSON.stringify(SAMPLE_SCHEMA),
      });
  });
});
