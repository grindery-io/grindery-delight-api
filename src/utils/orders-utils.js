/**
 * This function returns a MongoDB pipeline for retrieving offers in orders, with optional pagination.
 * @param req - The `req` parameter is likely an HTTP request object, which contains information about
 * the incoming request such as headers, query parameters, and request body. It is used in this
 * function to extract the `offset` and `limit` query parameters.
 * @param query - The `query` parameter is an object that contains the filters and options to be
 * applied to the MongoDB aggregation pipeline. It is used to build the pipeline that will be executed
 * to retrieve data from the database.
 * @returns The function `getPipelineOfferInOrders` is returning a pipeline of MongoDB aggregation
 * stages that can be used to query and retrieve data from a MongoDB database. The pipeline includes
 * stages such as sorting by date in descending order, skipping a certain number of documents based on
 * the offset parameter, and limiting the number of documents returned based on the limit parameter.
 * The pipeline is generated based on the input query and request
 */
export function getPipelineOfferInOrders(req, query) {
  const pipeline = getPipelineOfferInOrder(query);
  pipeline.push(
    {
      $sort: { date: -1 },
    },
    { $skip: +req.query.offset || 0 }
  );

  if (req.query.limit) {
    pipeline.push({ $limit: +req.query.limit });
  }

  return pipeline;
}

/**
 * This function returns a pipeline for MongoDB aggregation that matches a query and looks up offers
 * based on their offerId.
 * @param query - The `query` parameter is an object that contains the conditions to filter the
 * documents in the pipeline. It is used in the `` stage to select only the documents that match
 * the specified criteria.
 * @returns This function returns an array of MongoDB aggregation pipeline stages. The pipeline stages
 * are used to query and retrieve data from a MongoDB database collection named "offers" based on the
 * input query. The pipeline stages include a  stage to filter the data based on the query, a
 *  stage to join the "offers" collection with the current collection based on the "offerId"
 * field, and a $
 */
export function getPipelineOfferInOrder(query) {
  return [
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'offers',
        localField: 'offerId',
        foreignField: 'offerId',
        as: 'offer',
      },
    },
    {
      $addFields: {
        offer: {
          $ifNull: [{ $first: '$offer' }, null],
        },
      },
    },
  ];
}

export const ORDER_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success', // the order has been created
  FAILURE: 'failure', // the order creation failed
  COMPLETION: 'completion',
  COMPLETE: 'complete', // it means that the order is fully completed and paid for (this is confirmed by the blockchain)
  COMPLETION_FAILURE: 'completionFailure', // it means that Gordon tried to pay for the order but it failed
};
