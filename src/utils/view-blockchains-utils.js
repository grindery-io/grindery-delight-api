import { ethers } from 'ethers';
import axios from 'axios';

export const GrtPoolAddress = '0x29e2b23FF53E6702FDFd8C8EBC0d9E1cE44d241A';

/**
 * This function updates the completion order status of an offer based on whether or not the payment
 * has been made.
 * @param db - The `db` parameter is likely a database object or connection that is used to interact
 * with a database. It is used to query the `offers` and `blockchains` collections in the code snippet.
 * @param order - The `order` parameter is an object that represents an order and contains properties
 * such as `offerId`, `hashCompletion`, `isComplete`, and `status`. The function updates the
 * `isComplete` and `status` properties of the `order` object based on whether the payment for the
 * order
 * @returns the updated `order` object with the `isComplete` and `status` properties based on the
 * result of the `isPaidOrderFromHash` function.
 */
export async function updateCompletionOrder(db, order) {
  const { chainId } = await db
    .collection('offers')
    .findOne({ offerId: order.offerId });
  const chain = await db.collection('blockchains').findOne({ chainId });

  order.isComplete = await isPaidOrderFromHash(
    chain.rpc[0],
    order.hashCompletion
  );
  order.status = order.isComplete ? 'complete' : 'paymentFailure';

  return order;
}

/**
 * This function updates an order's information from a database based on its chain ID and hash.
 * @param db - The database object used to interact with the database.
 * @param order - The order object contains information about an order, including its chainId and hash,
 * as well as other properties such as amountTokenDeposit, addressTokenDeposit, destAddr, offerId,
 * amountTokenOffer, and status.
 * @returns the updated order object with additional properties such as amountTokenDeposit,
 * addressTokenDeposit, chainIdTokenDeposit, destAddr, offerId, amountTokenOffer, and status.
 */
export async function updateOrderFromDb(db, order) {
  const chain = await db.collection('blockchains').findOne({
    chainId: order.chainId,
  });

  const orderId = await getOrderIdFromHash(chain.rpc[0], order.hash);

  if (orderId === '') {
    order.status = 'failure';
  } else {
    const onChainOrder = await getOrderInformation(
      new ethers.Contract(
        GrtPoolAddress,
        (
          await getAbis()
        ).poolAbi,
        getProviderFromRpc(chain.rpc[0])
      ),
      orderId
    );

    order.amountTokenDeposit = onChainOrder.depositAmount;
    order.addressTokenDeposit = onChainOrder.depositToken;
    order.chainIdTokenDeposit = onChainOrder.depositChainId;
    order.destAddr = onChainOrder.destAddr;
    order.offerId = onChainOrder.offerId;
    order.amountTokenOffer = onChainOrder.amountTokenOffer;
    order.status = 'success';
  }

  return order;
}

/**
 * The function retrieves information about a specific order from a smart contract.
 * @param contract - The contract parameter is likely an instance of a smart contract on the Ethereum
 * blockchain. It is used to interact with the functions and data stored on the contract.
 * @param orderId - The `orderId` parameter is an identifier for a specific order in the smart
 * contract. The function `getOrderInformation` takes this parameter and retrieves various pieces of
 * information related to that order from the smart contract.
 * @returns The function `getOrderInformation` is returning an object with the following properties:
 */
export async function getOrderInformation(contract, orderId) {
  return {
    depositAmount: ethers.utils
      .formatEther(await contract.getDepositAmount(orderId))
      .toString(),
    depositToken: await contract.getDepositToken(orderId),
    depositChainId: (await contract.getDepositChainId(orderId)).toString(),
    destAddr: await contract.getRecipient(orderId),
    offerId: await contract.getIdOffer(orderId),
    amountTokenOffer: ethers.utils
      .formatEther(await contract.getAmountOffer(orderId))
      .toString(),
  };
}

/**
 * This function retrieves the order ID from a transaction hash using a specified RPC provider.
 * @param rpc - The rpc parameter is likely a URL or endpoint for a remote procedure call (RPC) server.
 * This server is used to interact with a blockchain network, such as Ethereum, and execute
 * transactions or retrieve data from the network.
 * @param hash - The `hash` parameter is a string representing the transaction hash of a previously
 * sent transaction on the blockchain network. This function retrieves the order ID from the
 * transaction receipt of that transaction.
 * @returns the third topic of the first log in the transaction receipt object if the transaction
 * status is not 0, otherwise it returns an empty string. The third topic is assumed to be the order
 * ID.
 */
export async function getOrderIdFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  return txReceipt.status === 0 ? '' : txReceipt.logs[0].topics[2];
}

/**
 * This function checks if a transaction hash corresponds to a paid order using Ethereum blockchain and
 * ethers.js library.
 * @param rpc - The RPC (Remote Procedure Call) endpoint is a URL that allows the code to communicate
 * with the Ethereum network. It is used to send and receive data from the blockchain.
 * @param hash - The hash parameter is a string representing the transaction hash of a blockchain
 * transaction.
 * @returns a boolean value. It will return `true` if the transaction with the given hash is a paid
 * order, and `false` if it is not a paid order or if the transaction failed (status is 0).
 */
export async function isPaidOrderFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  const iface = new ethers.utils.Interface(
    (await getAbis()).liquidityWalletAbi
  );

  if (txReceipt.status === 0) {
    return false;
  }

  return (
    txReceipt.logs.find(
      (log) => iface.parseLog(log).name === 'LogOfferPaid'
    ) !== undefined
  );
}

/**
 * This function returns a new instance of the JsonRpcProvider class from the ethers.providers module
 * using the provided rpc parameter.
 * @param rpc - The `rpc` parameter is a string representing the URL of an Ethereum JSON-RPC endpoint.
 * This function creates a new instance of the `JsonRpcProvider` class from the `ethers.providers`
 * module using the provided `rpc` URL. This provider can be used to interact with the Ethereum network
 * @returns A function that takes an RPC endpoint as an argument and returns a new instance of the
 * `JsonRpcProvider` class from the `ethers.providers` library, which can be used to interact with an
 * Ethereum node over JSON-RPC.
 */
export function getProviderFromRpc(rpc) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

/**
 * The function retrieves ABIs (Application Binary Interfaces) for various contracts from specified
 * URLs and returns them as an object.
 * @returns The `getAbis` function returns an object with four properties: `poolAbi`, `tokenAbi`,
 * `liquidityWalletAbi`, and `satelliteAbi`. The first three properties contain the ABI (Application
 * Binary Interface) data for three different smart contracts, while the `satelliteAbi` property is set
 * to `null`. The ABI data is obtained by making HTTP
 */
export const getAbis = async () => {
  const promises = [
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/GrtPool.json',
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/ERC20Sample.json',
    'https://raw.githubusercontent.com/grindery-io/Depay-Reality/main/abis/GrtLiquidityWallet.json',
  ].map(async (url) => {
    const result = await axios.get(url).catch(() => {
      return null;
    });
    return result?.data || null;
  });

  const results = await Promise.all(promises);

  return {
    poolAbi: results[0],
    tokenAbi: results[1],
    liquidityWalletAbi: results[2],
    satelliteAbi: null,
  };
};
