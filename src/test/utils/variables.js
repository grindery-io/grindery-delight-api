import db from '../../db/conn-test.js';
import { Database } from '../../db/conn.js';

export const toDeleteDb = [];

const dbTests = await Database.getInstance({});

export const collectionOrders = dbTests.collection('orders');
export const collectionOffers = dbTests.collection('offers');
export const collectionBlockchains = dbTests.collection('blockchains');
export const collectionTokens = dbTests.collection('tokens');
export const collectionLiquidityWallet =
  dbTests.collection('liquidity-wallets');

export const pathBlockchains = '/test/blockchains';
export const pathOrders = '/test/orders';
export const pathTokens = '/test/tokens';
export const pathOffers = '/test/offers';
export const liquidityWalletPath = '/test/liquidity-wallets';

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
  isActive: true,
  title: '',
  image: '',
  amount: '',
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
