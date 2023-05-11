import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonBoolean,
  testNonMongodbId,
} from './utils/utils.js';
import {
  pathTokens_Post,
  pathTokens_Put_MongoDBId,
  token,
  notAMongoDBId,
  randomMongoDBId,
  pathWebhooks_Put_Offer_Status,
} from './utils/variables.js';

chai.use(chaiHttp);

describe('Webhooks route - Validators', async function () {
  describe('PUT by Offer Status', async function () {
    for (const testCase of Object.keys(token)) {
      testNonString({
        method: 'put',
        path: pathWebhooks_Put_Offer_Status,
        body: {
          orderId: 123,
          completionHash: 'myCompletionHash',
        },
        query: {},
        field: 'orderId',
      });

      testNonEmpty({
        method: 'put',
        path: pathWebhooks_Put_Offer_Status,
        body: {
          ...token,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }
  });
});
