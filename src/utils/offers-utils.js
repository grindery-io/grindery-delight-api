/**
 * This function returns a MongoDB pipeline for retrieving liquidity wallet offers, with optional
 * pagination.
 * @param req - The `req` parameter is likely an HTTP request object, which contains information about
 * the incoming request such as headers, query parameters, and request body. It is used in this
 * function to extract the `offset` and `limit` query parameters.
 * @param query - The `query` parameter is an object that contains the filters and options to be
 * applied to the MongoDB aggregation pipeline. It is used to build the pipeline that will be executed
 * to retrieve data from the database.
 * @returns The function `getPipelineLiquidityWalletInOffers` is returning a pipeline of MongoDB
 * aggregation stages that will be used to query and sort data from a collection. The pipeline includes
 * a sorting stage to sort the data by date in descending order, a skipping stage to skip a certain
 * number of documents based on the offset query parameter, and an optional limiting stage to limit the
 * number of documents returned based on
 */
export function getPipelineLiquidityWalletInOffers(req, query) {
  const pipeline = getPipelineLiquidityWalletInOffer(query);
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
 * This function returns a pipeline that matches a query and looks up a liquidity wallet based on the
 * chain ID and provider.
 * @param query - The query parameter is an object that contains the conditions to filter the documents
 * in the initial match stage of the aggregation pipeline. It is used to find documents that match the
 * specified criteria.
 * @returns This function returns an array of MongoDB aggregation pipeline stages. The pipeline is used
 * to query and lookup data from the "liquidity-wallets" collection based on the provided query
 * parameter. The result includes the matched documents and the corresponding liquidity wallet
 * document, if any, as an array in the "liquidityWallet" field. The  stage is used to set
 * the "liquidityWallet"
 */
export function getPipelineLiquidityWalletInOffer(query) {
  return [
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'liquidity-wallets',
        let: {
          chainId: '$chainId',
          provider: '$provider',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$chainId', '$$chainId'] },
                  { $eq: ['$walletAddress', '$$provider'] },
                ],
              },
            },
          },
        ],
        as: 'liquidityWallet',
      },
    },
    {
      $addFields: {
        liquidityWallet: {
          $ifNull: [{ $first: '$liquidityWallet' }, null],
        },
      },
    },
  ];
}

/**
 * This function retrieves offers with their corresponding liquidity wallets from a database.
 * @param db - The `db` parameter is likely a database object or connection that is used to interact
 * with a database. It is used in this function to retrieve a collection of liquidity wallets from the
 * database.
 * @param offers - An array of offer objects.
 * @returns The function `getOffersWithLiquidityWallets` returns a Promise that resolves to an array of
 * offers, where each offer has additional information about its associated liquidity wallet. The
 * additional information is obtained by calling the `getOneOfferWithLiquidityWallet` function for each
 * offer in the input array, using the `collectionLiquidityWallet` collection from the database.
 */
export async function getOffersWithLiquidityWallets(db, offers) {
  return await Promise.all(
    offers.map(async (offer) => {
      return await getOneOfferWithLiquidityWallet(
        db.collection('liquidity-wallets'),
        offer
      );
    })
  );
}

/**
 * This function returns an offer object with its corresponding liquidity wallet object from a
 * collection, based on the offer's chain ID and provider wallet address.
 * @param collectionLiquidityWallet - It is a collection or database table that contains liquidity
 * wallet information for different chains and wallet addresses.
 * @param offer - The `offer` parameter is an object that represents an offer made by a provider on a
 * specific blockchain network. It likely contains properties such as `chainId`, `provider`, and other
 * relevant information about the offer.
 * @returns This function returns an object that contains the offer and its associated liquidity
 * wallet. If the offer is null, then the function returns null.
 */
export async function getOneOfferWithLiquidityWallet(
  collectionLiquidityWallet,
  offer
) {
  return offer
    ? {
        ...offer,
        liquidityWallet: await collectionLiquidityWallet.findOne({
          chainId: offer.chainId,
          walletAddress: offer.provider,
        }),
      }
    : null;
}

export const OFFER_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success', // the offer has been created
  FAILURE: 'failure', // the offer creation failed
  ACTIVATION: 'activation', // being activated
  ACTIVATION_FAILURE: 'activationFailure', // activation failed
  DEACTIVATION: 'deactivation', // being deactivated
  DEACTIVATION_FAILURE: 'deactivationFailure', // deactivation failed
};
