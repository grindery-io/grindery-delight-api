import { Database } from '../../db/conn.js';

// On-chain addresses
export const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

const dbTests = await Database.getInstance({});

export const collectionAdmins = dbTests.collection('admins');
export const collectionOrders = dbTests.collection('orders');
export const collectionOffers = dbTests.collection('offers');
export const collectionBlockchains = dbTests.collection('blockchains');
export const collectionTokens = dbTests.collection('tokens');
export const collectionLiquidityWallet =
  dbTests.collection('liquidity-wallets');

export const validMongoDBId = '111111111111111111111111';
export const randomMongoDBId = 'myMongoDBId';
export const notAMongoDBId = 'notAMongoDBId';

// Admins paths
export const pathAdmin_Get_IsAdmin = '/unit-test/admins';

// Blockchains paths
export const pathBlockchains_Post_NewBlockchain = '/unit-test/blockchains';
export const pathBlockchains_Get_MongoDBId = '/unit-test/blockchains/';
export const pathBlockchains_Get_Active = '/unit-test/blockchains/active';
export const pathBlockchains_Put_MongoDBId = '/unit-test/blockchains/';
export const pathBlockchains_Delete_MongoDBId = '/unit-test/blockchains/';
export const pathBlockchains_Put_UsefulAddress_MongoDBId =
  '/unit-test/blockchains/useful-address/';
export const pathBlockchains_Delete_UsefulAddress_MongoDBId =
  '/unit-test/blockchains/useful-address/';

// Liquidity wallets paths
export const pathLiquidityWallets_Post_NewLiquidityWallet =
  '/unit-test/liquidity-wallets';
export const pathLiquidityWallets_Get_LiquidityWalletByChainId =
  '/unit-test/liquidity-wallets';
export const pathLiquidityWallets_Delete = '/unit-test/liquidity-wallets';
export const pathLiquidityWallets_Put = '/unit-test/liquidity-wallets';
export const pathLiquidityWallets_Get_All = '/unit-test/liquidity-wallets/all';
export const pathLiquidityWallets_Get_Single =
  '/unit-test/liquidity-wallets/single';
export const pathLiquidityWallets_Get_MongoDBId =
  '/unit-test/liquidity-wallets/id/';

// Offers paths
export const pathOffers_Post = '/unit-test/offers';
export const pathOffers_Get_All = '/unit-test/offers';
export const pathOffers_Get_OfferId = '/unit-test/offers/offerId';
export const pathOffers_Get_Search = '/unit-test/offers/search';
export const pathOffers_Get_User = '/unit-test/offers/user';
export const pathOffers_Get_MongoDBId = '/unit-test/offers/id';
export const pathOffers_Delete_MongoDBId = '/unit-test/offers/';
export const pathOffers_Put = '/unit-test/offers/';
export const pathOffers_Put_Activation = '/unit-test/offers/activation';

// Orders paths
export const pathOrders_Post = '/unit-test/orders';
export const pathOrders_Get_OrderId = '/unit-test/orders/orderId';
export const pathOrders_Get_User = '/unit-test/orders/user';
export const pathOrders_Get_MongoDBId = '/unit-test/orders/id';
export const pathOrders_Get_LiquidityProvider =
  '/unit-test/orders/liquidity-provider';
export const pathOrders_Delete_OrderId = '/unit-test/orders/';
export const pathOrders_Put_Status = '/unit-test/orders/status';
export const pathOrders_Put_Complete = '/unit-test/orders/complete';

// Tokens paths
export const pathTokens_Post = '/unit-test/tokens';
export const pathTokens_Get_Active = '/unit-test/tokens/active';
export const pathTokens_Get_MongoDBId = '/unit-test/tokens/';
export const pathTokens_Put_MongoDBId = '/unit-test/tokens/';
export const pathTokens_Delete_MongoDBId = '/unit-test/tokens/';

// Modify orders blockchain paths
export const pathViewBlockchain_Put_OrdersUser =
  '/unit-test/orders-onchain/update-order-user';
export const pathViewBlockchain_Put_OrdersAll =
  '/unit-test/orders-onchain/update-order-all';
export const pathViewBlockchain_Put_OrdersCompleteUser =
  '/unit-test/orders-onchain/update-order-completion-user';
export const pathViewBlockchain_Put_OrdersCompleteAll =
  '/unit-test/orders-onchain/update-order-completion-all';

// Modify offers blockchain paths
export const pathBlockchain_Put_OffersUser =
  '/unit-test/offers-onchain/update-offer-user';
export const pathBlockchain_Put_OffersAll =
  '/unit-test/offers-onchain/update-offer-all';
export const pathBlockchain_Put_OffersActivation =
  '/unit-test/offers-onchain/update-offer-activation-user';
export const pathBlockchain_Put_OffersActivationAll =
  '/unit-test/offers-onchain/update-offer-activation-all';

export const order = {
  amountTokenDeposit: '0.34',
  addressTokenDeposit: '0x0',
  chainIdTokenDeposit: '13434',
  destAddr: 'mydestAddr',
  offerId: 'myOfferId',
  orderId: 'myOrderId',
  amountTokenOffer: '5433',
  hash: 'myhash',
};

export const offer = {
  chainId: '97',
  min: '0.02',
  max: '1',
  tokenId: '45',
  token: 'BNB',
  tokenAddress: '0x0',
  hash: '0x56ee9a0e1063631dbdb5f2b8c6946aecf9a765a9470f023e3a8afb8fbf86d7a4',
  exchangeRate: '1',
  exchangeToken: 'ETH',
  exchangeChainId: '5',
  estimatedTime: '123',
  provider: '0x795beefD41337BB83903788949c8AC2D559A44a3',
  offerId: '0x02689c291c6d392ab9c02fc2a459a08cc46cc816b77cec928c86109d37ed2843',
  isActive: true,
  title: '',
  image: '',
  amount: '',
};

export const modifiedOffer = {
  chainId: '76',
  min: '10',
  max: '100',
  tokenId: 'token-id',
  token: 'token',
  tokenAddress: 'token-address',
  exchangeRate: '2',
  exchangeToken: 'exchange-token',
  exchangeChainId: 'exchange-chain-id',
  estimatedTime: '1 day',
  provider: 'provider',
  title: 'title',
  image: 'image',
  amount: '50',
};

export const modifyOfferValidator = {
  chainId: '97',
  min: '0.02',
  max: '1',
  tokenId: '45',
  token: 'BNB',
  tokenAddress: '0x0',
  exchangeRate: '1',
  exchangeChainId: '5',
  estimatedTime: '123',
  provider: '0x795beefD41337BB83903788949c8AC2D559A44a3',
  title: '',
  image: '',
  amount: '',
  offerId: 'myNewOfferId',
};

export const searchActiveOfferValidator = {
  exchangeChainId: 'myExchangeChainId',
  exchangeToken: 'myExchangeToken',
  chainId: 'myChainId',
  token: 'myToken',
};

export const blockchain = {
  caipId: 'eip155:534',
  chainId: '534',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/blockchains/eip155-534.png',
  isActive: true,
  isEvm: true,
  isTestnet: true,
  label: 'myTestnet',
  nativeTokenSymbol: 'myTokenSymbol',
  rpc: [
    'https://goerli.blockpi.network/v1/rpc/public',
    'https://rpc.ankr.com/eth_goerli',
    'https://eth-goerli.public.blastapi.io',
  ],
  transactionExplorerUrl: 'https://goerli.etherscan.io/tx/{hash}',
  addressExplorerUrl: 'https://goerli.etherscan.io/address/{hash}',
  usefulAddresses: {
    myUsefulAddress1: 'myAddress1',
    myUsefulAddress2: 'myAddress2',
  },
};

export const usefulAddress = {
  contract: 'myContract1',
  address: 'myAddress1',
};

export const token = {
  coinmarketcapId: '4543',
  symbol: 'mySymbol',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/tokens/bnb.png',
  chainId: '544',
  address: '0x0',
  isNative: false,
  isActive: false,
};

export const liquidityWallet = {
  walletAddress: 'myWalletAddress',
  chainId: 'myChainId',
};

export const modifySingleLiquidityWallet = {
  chainId: 'myNewChainId',
  userId: 'myNewUserId',
};

export const updateTokenLiquidityWallet = {
  walletAddress: 'myNewWalletAddress',
  chainId: 'myNewChainId',
  tokenId: 'myNewTokenId',
  amount: '2121212',
};

export const blockchainGoerli = {
  caipId: 'eip155:5',
  chainId: '5',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/blockchains/eip155-5.png',
  isActive: true,
  isEvm: true,
  isTestnet: true,
  label: 'Goerli',
  nativeTokenSymbol: 'ETH',
  rpc: [
    'https://goerli.blockpi.network/v1/rpc/public',
    'https://rpc.ankr.com/eth_goerli',
  ],
  transactionExplorerUrl: 'https://goerli.etherscan.io/tx/{hash}',
  addressExplorerUrl: 'https://goerli.etherscan.io/address/{hash}',
};

export const blockchainBscTestnet = {
  caipId: 'eip155:97',
  chainId: '97',
  icon: 'https://www.grindery.io/hubfs/delight-assets/icons/blockchains/eip155-97.svg',
  isActive: true,
  isEvm: true,
  isTestnet: true,
  label: 'BSC Testnet',
  nativeTokenSymbol: 'BNB',
  rpc: [
    'https://bsc-testnet.public.blastapi.io',
    'https://data-seed-prebsc-1-s3.binance.org:8545',
  ],
  transactionExplorerUrl: 'https://testnet.bscscan.com/tx/{hash}',
  addressExplorerUrl: 'https://testnet.bscscan.com/address/{hash}',
};

export const updateOrderUserBody = {
  rpc: blockchainGoerli.rpc[0],
  grtPoolAddress: GrtPoolAddress,
};
