const BetFlip = artifacts.require("BetFlip");
const truffleAssert = require("truffle-assertions");

contract("BetFlip", async function(account){

  it("must be sent min 1 wei to funciton conFlip()", async function() {
    let i = await BetFlip.deployed();
    await truffleAssert.fails(
      i.queryRandom()
      , truffleAssert.ErrorType.REVERT
    );
  });

  it("should not coinFlip if there is not enough funds on SC to bet"
    , async function() {
      let i = await BetFlip.deployed();
      // there are no funds on samert contract yet
      await truffleAssert.fails(
          i.queryRandom(
            {from: account[1],
             value: web3.utils.toWei("10", "ether")
            }), truffleAssert.ErrorType.REVERT);
  });

  /*
  * deposti funds
  */
  it("should be possible to deposit Funds. Balances for SC and BC must be equal"
  , async function() {
      let i = await BetFlip.deployed();
      await i.depositSC({value: web3.utils.toWei("10", "gwei")});
      let balanceBC = parseFloat(await web3.eth.getBalance(i.address));
      let balanceSC = parseFloat(await i.getBalanceSC());
      assert(balanceSC === balanceBC , "balnace in SC and BC must be equal");
  });

  it("should be only possible for the owner to deposit funds to smart contract"
    , async function() {
      let i = await BetFlip.deployed();
      await truffleAssert.fails(
        i.depositSC({from: account[1], value: web3.utils.toWei("10", "gwei")})
        , truffleAssert.ErrorType.REVERT
      );
  });

  it("should flip the coin! Balances of SC and in BC must be equal!"
    , async function() {
       let i = await BetFlip.deployed();
       let GAS_FOR_CALLBACK = 200000;

       async function testCoinFlip(won) {
         let oBalSC = parseFloat(await i.getBalanceSC());
         let oBalBC = parseFloat(await web3.eth.getBalance(i.address));
         let oBalPl = parseFloat(await i.getPlayerBalance({from:account[1]}));

         // balances must be the same because of above test case
         let queryID;
         let proof;

         await i.queryRandom(
           {from:account[1],
           value: web3.utils.toWei("1", "gwei")}
         ).then(function(res) {
           queryID = res.logs[0].args.queryID;
           proof = res.logs[0].args.proof;
         });

        let  wager = parseFloat(await i.getPlayerWager({from:account[1]}));

        await i.__callback(queryID, won, proof).then(async function(res) {
           // TODO:  falls es nicht funtktioniert: https://ethereum.stackexchange.com/questions/38476/passing-bytes32-in-truffle-test
           // check results
           result = parseFloat(res.logs[0].args.randomNumber);
           // get new balances
           let nBalSC1 = parseFloat(await i.getBalanceSC());
           let nBalBC1 = parseFloat(await web3.eth.getBalance(i.address));
           let nBalPl1 = parseFloat(await i.getPlayerBalance({from:account[1]}));

          if (result == 1){
            //balance of player must increase and balance of SC must decrease
            assert(oBalPl + 2 * wager === nBalPl1
                 && oBalSC - wager === nBalSC1
                 && nBalBC1 - GAS_FOR_CALLBACK === nBalSC1 + nBalPl1
                 , "Balance of player must increase and balance of BC must"
                 + " be equal to balnace of player and sc");
          }else { //lose
            assert(oBalPl === nBalPl1
                 && oBalSC + wager === nBalSC1
                 && nBalBC1- GAS_FOR_CALLBACK === nBalSC1 + nBalPl1
                 , "Balance of sc must increase and balance of BC must"
                 + " be equal to balnace of player and sc");
            }
            GAS_FOR_CALLBACK += GAS_FOR_CALLBACK;
         })
       };
      //lose CoinFlip
      await testCoinFlip("1");
      //win CoinFlip
      await testCoinFlip("0");
  });

  it("should be possible for the player to withraw funds. After withrawl the"
      +" balances must be deducted in both samart contract and blockchain "
      , async function() {
        let i = await BetFlip.deployed();
        let oBalSC = parseFloat(await i.getBalanceSC());
        let oBalBC = parseFloat(await web3.eth.getBalance(i.address));
        let oBalPl = parseFloat(await i.getPlayerBalance({from:account[1]}));

        await i.withdrawPlayerBalance({from:account[1]});

        let nBalSC1 = parseFloat(await i.getBalanceSC());
        let nBalBC1 = parseFloat(await web3.eth.getBalance(i.address));
        let nBalPl1 = parseFloat(await i.getPlayerBalance({from:account[1]}));


        assert(nBalPl1 === 0
              && nBalBC1 === oBalBC - oBalPl,
            "Balances not correct!");

  });

  it("should be only possible for the owner to withraw smart contract funds"
      , async function() {
        let i = await BetFlip.deployed();
        let withdraw = 1000;
        let oBalSC = parseFloat(await i.getBalanceSC());
        let oBalBC = parseFloat(await web3.eth.getBalance(i.address));

        await truffleAssert.fails(
            i.withdrawSCBalance(withdraw, {from:account[1]})
          , truffleAssert.ErrorType.REVERT);

        await i.withdrawSCBalance(withdraw);
        let nBalSC1 = parseFloat(await i.getBalanceSC());
        let nBalBC1 = parseFloat(await web3.eth.getBalance(i.address));

        assert(oBalBC - nBalBC1 === oBalSC - nBalSC1,
                "balances not correct");
    });



}); //contract("BetFlip", async function(account){
