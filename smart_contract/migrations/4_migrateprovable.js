const usingProvable = artifacts.require("usingProvable");

module.exports = function(deployer) {
  deployer.deploy(usingProvable);
};
