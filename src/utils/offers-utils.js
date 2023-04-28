import { Database } from '../db/conn.js';

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
