import { ethers } from 'ethers';
import axios from 'axios';

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

export async function getOrderIdFromHash(rpc, hash) {
  const provider = getProviderFromRpc(rpc);
  const txReceipt = await provider.getTransactionReceipt(hash);
  return txReceipt.status === 0 ? '' : txReceipt.logs[0].topics[2];
}

export function getProviderFromRpc(rpc) {
  return new ethers.providers.JsonRpcProvider(rpc);
}

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
