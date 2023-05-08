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

export const ORDER_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success', // the order has been created
  FAILURE: 'failure', // the order creation failed
  COMPLETION: 'completion',
  COMPLETE: 'complete', // it means that the order is fully completed and paid for (this is confirmed by the blockchain)
  COMPLETION_FAILURE: 'completionFailure', // it means that Gordon tried to pay for the order but it failed
};
