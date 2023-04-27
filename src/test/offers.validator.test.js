import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import {
  mockedToken,
  testNonString,
  testNonEmpty,
  testNonBoolean,
  testUnexpectedField,
  testNonMongodbId,
} from './utils/utils.js';
import {
  pathOffers,
  offer,
  searchActiveOfferValidator,
  modifyOfferValidator,
} from './utils/variables.js';

chai.use(chaiHttp);

describe('Offers route - Validators', async function () {
  // Retry all tests in this suite up to 4 times
  this.retries(4);

  describe('POST new offer', async function () {
    it('Should fail validation if min is greater than max', async function () {
      const invalidOffer = {
        chainId: '1',
        min: '30',
        max: '20',
        tokenId: 'tokenId',
        token: 'token',
        tokenAddress: 'tokenAddress',
        hash: 'hash',
        offerId: 'offerId',
        isActive: true,
        estimatedTime: '3 days',
        exchangeRate: '5',
        exchangeToken: 'ETH',
        exchangeChainId: '1',
        provider: 'provider',
        title: 'title',
        image: 'image',
        amount: 'amount',
      };

      // Make a request to create the offer with invalid data
      const res = await chai
        .request(app)
        .post(pathOffers)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .send(invalidOffer);

      // Assertions
      chai.expect(res).to.have.status(400);
      chai.expect(res.body).to.be.an('array');
      chai.expect(res.body.length).to.equal(1);
      chai.expect(res.body[0].location).to.equal('body');
      chai.expect(res.body[0].msg).to.equal('min must be less than max');
    });

    for (const testCase of Object.keys(offer)) {
      if (testCase !== 'isActive') {
        testNonString({
          method: 'post',
          path: pathOffers,
          body: {
            ...offer,
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      if (
        testCase !== 'title' &&
        testCase !== 'image' &&
        testCase !== 'amount' &&
        testCase !== 'provider'
      ) {
        testNonEmpty({
          method: 'post',
          path: pathOffers,
          body: {
            ...offer,
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    }

    testNonBoolean({
      method: 'post',
      path: pathOffers,
      body: {
        ...offer,
        isActive: 123,
      },
      query: {},
      field: 'isActive',
    });

    testUnexpectedField({
      method: 'post',
      path: pathOffers,
      body: {
        ...offer,
        unexpectedField: 'Unexpected field',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'post',
      path: pathOffers,
      body: {
        ...offer,
      },
      query: { unexpectedField: 'Unexpected field' },
      field: 'unexpectedField',
      location: 'query',
    });
  });

  describe('GET all active offers with filters', async function () {
    for (const testCase of Object.keys(searchActiveOfferValidator)) {
      testNonString({
        method: 'get',
        path: '/unit-test/offers/search',
        body: {},
        query: { ...searchActiveOfferValidator, [testCase]: [123, 123] },
        field: testCase,
      });

      testNonEmpty({
        method: 'get',
        path: '/unit-test/offers/search',
        body: {},
        query: { ...searchActiveOfferValidator, [testCase]: '' },
        field: testCase,
      });
    }
  });

  describe('GET offer by offerId', async function () {
    testNonString({
      method: 'get',
      path: '/unit-test/offers/offerId',
      body: {},
      query: { offerId: [123, 123] },
      field: 'offerId',
    });

    testNonEmpty({
      method: 'get',
      path: '/unit-test/offers/offerId',
      body: {},
      query: { offerId: '' },
      field: 'offerId',
    });
  });

  describe('GET offer by MongoDB id', async function () {
    testNonMongodbId({
      method: 'get',
      path: '/unit-test/offers/id',
      body: {},
      query: { id: 'nonMongodbId' },
      field: 'id',
    });
  });

  describe('PUT offer by offerId', async function () {
    for (const testCase of Object.keys(modifyOfferValidator)) {
      if (testCase !== 'isActive') {
        testNonString({
          method: 'put',
          path: '/unit-test/offers/1234',
          body: {
            [testCase]: 123,
          },
          query: {},
          field: testCase,
        });
      }

      if (
        testCase !== 'title' &&
        testCase !== 'image' &&
        testCase !== 'amount'
      ) {
        testNonEmpty({
          method: 'put',
          path: '/unit-test/offers/1234',
          body: {
            [testCase]: '',
          },
          query: {},
          field: testCase,
        });
      }
    }

    testUnexpectedField({
      method: 'put',
      path: '/unit-test/offers/1234',
      body: {
        unexpectedField: 'Unexpected field',
      },
      query: {},
      field: 'unexpectedField',
      location: 'body',
    });

    testUnexpectedField({
      method: 'put',
      path: '/unit-test/offers/1234',
      body: {
        chainId: '3434',
      },
      query: { unexpectedField: 'Unexpected field' },
      field: 'unexpectedField',
      location: 'query',
    });
  });
});
