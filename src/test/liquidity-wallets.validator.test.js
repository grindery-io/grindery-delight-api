import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  testNonString,
  testNonEmpty,
  testUnexpectedField,
  testNonMongodbId,
} from './utils/utils.js';
import {
  pathLiquidityWallets_Post_NewLiquidityWallet,
  mockLiquidityWallet,
  mockModifySingleLiquidityWallet,
  mockUpdateTokenLiquidityWallet,
  pathLiquidityWallets_Get_MongoDBId,
  notAMongoDBId,
  pathLiquidityWallets_Get_Single,
  pathLiquidityWallets_Get_LiquidityWalletByChainId,
  pathLiquidityWallets_Delete,
  pathLiquidityWallets_Put,
} from './utils/variables.js';

/* eslint-disable no-unused-expressions */

chai.use(chaiHttp);

describe('Liquidity wallets route - Validators', async function () {
  describe('POST new liquidity wallet', async function () {
    const testCases = ['walletAddress', 'chainId'];
    for (const testCase of testCases) {
      testNonString({
        method: 'post',
        path: pathLiquidityWallets_Post_NewLiquidityWallet,
        body: {
          ...mockLiquidityWallet,
          [testCase]: 123,
        },
        query: {},
        field: testCase,
      });
      testNonEmpty({
        method: 'post',
        path: pathLiquidityWallets_Post_NewLiquidityWallet,
        body: {
          ...mockLiquidityWallet,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'post',
      path: pathLiquidityWallets_Post_NewLiquidityWallet,
      body: {
        ...mockLiquidityWallet,
        unexpectedField: 'unexpectedValue',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'post',
      path: pathLiquidityWallets_Post_NewLiquidityWallet,
      body: mockLiquidityWallet,
      query: { unexpectedField: 'unexpectedValue' },
      field: 'unexpectedField',
      location: 'query',
    });
  });

  describe('GET by chainId', async function () {
    testNonString({
      method: 'get',
      path: pathLiquidityWallets_Get_LiquidityWalletByChainId,
      body: {},
      query: { chainId: ['chainId1', 'chainId2'] },
      field: 'chainId',
    });

    testNonEmpty({
      method: 'get',
      path: pathLiquidityWallets_Get_LiquidityWalletByChainId,
      body: {},
      query: { chainId: '' },
      field: 'chainId',
    });
  });

  describe('GET single liquidity wallets', async function () {
    const testCases = ['userId', 'chainId'];
    for (const testCase of testCases) {
      testNonString({
        method: 'get',
        path: pathLiquidityWallets_Get_Single,
        body: {},
        query: {
          ...mockModifySingleLiquidityWallet,
          [testCase]: ['45', '45'],
        },
        field: testCase,
      });

      testNonEmpty({
        method: 'get',
        path: pathLiquidityWallets_Get_Single,
        body: {},
        query: {
          ...mockModifySingleLiquidityWallet,
          [testCase]: '',
        },
        field: testCase,
      });
    }
  });

  describe('GET liquidity wallet by MongoDbId', async function () {
    testNonMongodbId({
      method: 'get',
      path: pathLiquidityWallets_Get_MongoDBId + notAMongoDBId,
      body: {},
      query: {},
      field: 'id',
    });
  });

  describe('DELETE liquidity wallets', async function () {
    const testCases = ['walletAddress', 'chainId'];
    for (const testCase of testCases) {
      testNonString({
        method: 'delete',
        path: pathLiquidityWallets_Delete,
        body: {},
        query: {
          ...mockLiquidityWallet,
          [testCase]: ['45', '45'],
        },
        field: testCase,
      });

      testNonEmpty({
        method: 'delete',
        path: pathLiquidityWallets_Delete,
        body: {},
        query: {
          ...mockLiquidityWallet,
          [testCase]: '',
        },
        field: testCase,
      });
    }
  });

  describe('PUT liquidity wallets', async function () {
    const testCases = ['walletAddress', 'chainId', 'tokenId', 'amount'];

    for (const testCase of testCases) {
      testNonString({
        method: 'put',
        path: pathLiquidityWallets_Put,
        body: {
          ...mockUpdateTokenLiquidityWallet,
          [testCase]: 123,
        },
        query: {},
        field: testCase,
      });
      testNonEmpty({
        method: 'put',
        path: pathLiquidityWallets_Put,
        body: {
          ...mockUpdateTokenLiquidityWallet,
          [testCase]: '',
        },
        query: {},
        field: testCase,
      });
    }

    testUnexpectedField({
      method: 'put',
      path: pathLiquidityWallets_Put,
      body: {
        ...mockUpdateTokenLiquidityWallet,
        unexpectedField: 'unexpectedValue',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: pathLiquidityWallets_Put,
      body: mockUpdateTokenLiquidityWallet,
      query: { unexpectedField: 'unexpectedValue' },
      field: 'unexpectedField',
      location: 'query',
    });
  });
});
