import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../index.js';
import { mockedToken } from './utils/utils.js';
import { ObjectId } from 'mongodb';
import {
  collectionOrders,
  collectionOffers,
  pathOrders_Post,
  order,
  offer,
  pathOrders_Get_OrderId,
  pathOrders_Get_User,
  pathOrders_Get_MongoDBId,
  pathOrders_Delete_OrderId,
  pathOrders_Put_Complete,
  pathOffers_Post,
  pathOrders_Get_LiquidityProvider,
  pathOrders_Put_Status,
} from './utils/variables.js';
import { Database } from '../db/conn.js';

chai.use(chaiHttp);

/**
 * This function creates a base order or offer in a MongoDB collection and returns the response.
 * @returns the response object from the POST request made using chai.request.
 */
async function createBaseOrderOrOffer({ collection, path, body }) {
  const res = await chai
    .request(app)
    .post(path)
    .set('Authorization', `Bearer ${mockedToken}`)
    .send(body);
  chai.expect(res).to.have.status(200);
  chai.expect(res.body).to.have.property('acknowledged').that.is.true;
  chai.expect(res.body).to.have.property('insertedId').that.is.not.empty;
  return res;
}

describe('Orders route', async function () {
  describe('POST new order', async function () {
    it('Should return 403 if no token is provided', async function () {
      const createResponse = await chai
        .request(app)
        .post(pathOrders_Post)
        .send(order);
      chai.expect(createResponse).to.have.status(403);
    });
    it('Should POST a new order', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
    });

    it('Should POST a new order with relevant fields', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      const getOrder = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .query({ orderId: order.orderId })
        .set('Authorization', `Bearer ${mockedToken}`);
      // Assertions
      chai.expect(getOrder).to.have.status(200);
      chai.expect(getOrder.body).to.be.an('object');
      delete getOrder.body._id;
      delete getOrder.body.userId;
      delete getOrder.body.date;
      chai.expect(getOrder.body).to.deep.equal({
        ...order,
        isComplete: false,
        status: 'pending',
        offer: null,
      });
    });
    it('Should fail if same orderId exists', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      const createDuplicateResponse = await chai
        .request(app)
        .post(pathOrders_Post)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send(order);
      chai.expect(createDuplicateResponse).to.have.status(404);
      chai
        .expect(createDuplicateResponse.body.msg)
        .to.be.equal('This order already exists.');
    });
  });

  describe('GET by user', async function () {
    beforeEach(async function () {
      const db = await Database.getInstance({});
      const collectionOffers = db.collection('offers');
      await collectionOffers.insertOne(offer);
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: 'anotherUserId',
      });
    });
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get(pathOrders_Get_User);
      chai.expect(res).to.have.status(403);
    });
    it('Should return only orders for the given user and proper fields', async function () {
      const offerTmp = await collectionOffers.findOne({});
      const orderTmp = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });
      const res = await chai
        .request(app)
        .get(pathOrders_Get_User)
        .set({ Authorization: `Bearer ${mockedToken}` });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal([
        {
          ...orderTmp,
          _id: orderTmp._id.toString(),
          offer: {
            ...offerTmp,
            _id: offerTmp._id.toString(),
          },
        },
      ]);
    });
  });
  describe('GET by orderId', async function () {
    beforeEach(async function () {
      const db = await Database.getInstance({});
      const collectionOffers = db.collection('offers');
      await collectionOffers.insertOne(offer);
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
      await collectionOrders.insertOne({
        ...order,
        orderId: 'anotherOrderId',
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(403);
    });

    it('Should get an order corresponding to orderId', async function () {
      const offerTmp = await collectionOffers.findOne({});
      const orderTmp = await collectionOrders.findOne({
        orderId: order.orderId,
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: order.orderId });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        ...orderTmp,
        _id: orderTmp._id.toString(),
        offer: {
          ...offerTmp,
          _id: offerTmp._id.toString(),
        },
      });
    });

    it('Should return an empty string if no order exists', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_OrderId)
        .set('Authorization', `Bearer ${mockedToken}`)
        .query({ orderId: 'nonExistingOrderId' });
      chai.expect(res).to.have.status(200);
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object');
      chai.expect(res.body).to.be.empty;
    });
  });

  describe('GET by MongoDbId', async function () {
    beforeEach(async function () {
      const db = await Database.getInstance({});

      await db.collection('offers').insertOne(offer);
      await collectionOrders.insertOne({
        ...order,
        offerId: offer.offerId,
        userId: process.env.USER_ID_TEST,
      });
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .query({ id: 'mongoDbId' });
      chai.expect(res).to.have.status(403);
    });

    it('Should return the order with the proper MongoDB id', async function () {
      const orderTmp = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderTmp._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body._id).to.equal(orderTmp._id.toString());
    });

    it('Should return the order with the proper userId', async function () {
      const orderTmp = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderTmp._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body.userId).to.equal(orderTmp.userId);
    });

    it('Should return the order with all the proper fields', async function () {
      const offerTmp = await collectionOffers.findOne({});
      const orderTmp = await collectionOrders.findOne({
        userId: process.env.USER_ID_TEST,
      });

      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: orderTmp._id.toString() });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        ...orderTmp,
        _id: orderTmp._id.toString(),
        offer: {
          ...offerTmp,
          _id: offerTmp._id.toString(),
        },
      });
    });

    it('Should return an empty object if MongoDB id doesnt exist', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: '111111111111111111111111' });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.be.an('object').that.is.empty;
    });
  });

  describe('GET by liquidity provider', async function () {
    beforeEach(async function () {
      await collectionOffers.insertMany([
        { ...offer, userId: process.env.USER_ID_TEST },
      ]);

      await collectionOrders.insertMany([
        {
          ...order,
          offerId: offer.offerId,
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          offerId: 'offerId1',
          userId: process.env.USER_ID_TEST,
        },
        {
          ...order,
          offerId: 'offerId2',
          userId: 'anotherUserId',
        },
      ]);
    });

    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).get(pathOrders_Get_LiquidityProvider);
      chai.expect(res).to.have.status(403);
    });

    it('Should show only orders with existing offerId in the offers collection', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      const orderTmp = await collectionOffers.findOne({
        offerId: res.body[0].offerId,
      });

      chai.expect(orderTmp).to.be.an('object');
      chai.expect(orderTmp).to.have.property('_id');
    });

    it('Should show only orders corresponding to active offers', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      res.body.forEach((order) => {
        chai.expect(order.offer.isActive).to.be.true;
      });
    });

    it('Should show only orders corresponding offers created by the user', async function () {
      const res = await chai
        .request(app)
        .get(pathOrders_Get_LiquidityProvider)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(200);

      res.body.forEach((order) => {
        chai.expect(order.offer.userId).to.equal(order.userId);
      });
    });
  });

  describe('DELETE order by orderId', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + 'myOrderId');
      chai.expect(res).to.have.status(403);
    });
    it('Should delete one order', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      const deleteResponse = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + order.orderId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(deleteResponse.body.acknowledged).to.be.true;
      chai.expect(deleteResponse.body.deletedCount).to.equal(1);
    });
    it('Should delete the appropriate order', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      chai.expect(
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.not.be.empty;
      const deleteResponse = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + order.orderId)
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(deleteResponse).to.have.status(200);
      chai.expect(
        await collectionOrders.findOne({
          _id: new ObjectId(createResponse.body.insertedId),
        })
      ).to.be.null;
    });
    it('Should return 404 with message if no order found', async function () {
      const res = await chai
        .request(app)
        .delete(pathOrders_Delete_OrderId + 'myOrderId')
        .set('Authorization', `Bearer ${mockedToken}`);
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found' });
    });
  });
  describe('PUT order as complete', async function () {
    it('Should return 403 if no token is provided', async function () {
      const res = await chai.request(app).put(pathOrders_Put_Complete).send({
        orderId: 'myOrderId',
      });
      chai.expect(res).to.have.status(403);
    });
    it('Should modify one order if the order was previously not completed', async function () {
      const createResponse = await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      const res = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(200);
      chai.expect(res.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 1,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
      const getOrder = await chai
        .request(app)
        .get(pathOrders_Get_MongoDBId)
        .set({ Authorization: `Bearer ${mockedToken}` })
        .query({ id: createResponse.body.insertedId });
      chai.expect(getOrder.body.isComplete).to.be.true;
    });
    it('Should modify no order if the order was previously completed', async function () {
      await createBaseOrderOrOffer({
        collection: collectionOrders,
        path: pathOrders_Post,
        body: order,
      });
      const res = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(200);
      const res1 = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res1).to.have.status(200);
      chai.expect(res1.body).to.deep.equal({
        acknowledged: true,
        modifiedCount: 0,
        upsertedId: null,
        upsertedCount: 0,
        matchedCount: 1,
      });
    });
    it('Should fail if no order exists', async function () {
      const res = await chai
        .request(app)
        .put(pathOrders_Put_Complete)
        .set('Authorization', `Bearer ${mockedToken}`)
        .send({
          orderId: order.orderId,
        });
      chai.expect(res).to.have.status(404);
      chai.expect(res.body).to.deep.equal({ msg: 'No order found.' });
    });
  });
});
