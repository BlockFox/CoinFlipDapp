const BetFlip = artifacts.require("BetFlip");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(BetFlip).then(async function(instance) {
    // set inital Funds at smart Contract
    await instance.depositSC({value: web3.utils.toWei("0.1", "ether")});
  });
};
