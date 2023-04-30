import { Database } from '../db/conn.js';

export async function getOrdersWithOffers(db, orders) {
  const collectionOffers = db.collection('offers');

  return await Promise.all(
    orders.map(async (order) => {
      return await getOneOrderWithOffer(collectionOffers, order);
    })
  );
}

export async function getOneOrderWithOffer(collectionOffers, order) {
  return order
    ? {
        ...order,
        offer: await collectionOffers.findOne({
          offerId: order.offerId,
        }),
      }
    : null;
}
