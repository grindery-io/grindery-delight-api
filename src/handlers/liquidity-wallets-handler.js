import GrinderyClient from 'grindery-nexus-client';

export const liquidityWalletCreatedHandler = (data) => {
  const nexus = new GrinderyClient();
  console.log(nexus);
};
