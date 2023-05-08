export async function getOffersWithLiquidityWallets(db, offers) {
  const collectionLiquidityWallet = db.collection('liquidity-wallets');

  return await Promise.all(
    offers.map(async (offer) => {
      return await getOneOfferWithLiquidityWallet(
        collectionLiquidityWallet,
        offer
      );
    })
  );
}

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
