var web3 = new Web3(Web3.givenProvider);
var betFlipInst;
//var address = "0x856BBd9F78b1f58FA01bFe94ca22a9398EB3a1D0";  // SC address on ropsten -> old version
var address = "0xEB65ceec0e5A56Bb30Cee97Ae16De32bB6893Ea2"; // // SC address on ropsten




$(document).ready(function() {

    $('#win_output').hide();
    $('#lose_output').hide();

    window.ethereum.enable().then(function(accounts){
      betFlipInst = new web3.eth.Contract(abi, address
          , {from:accounts[0]});
    })
    .then(updateBalance); // window.ethereum.enable().then(function(accounts)

      // TÓDO update Funds after refresh Page

      $("#flip_button").click(flipCoin);
      $("#withdraw_button").click(withdraw);

}); //$(document).ready(function()


function flipCoin() {
  // get wager
    let wagerEth = $("#wager_input").val();
    let won;

    if (wagerEth == 0 || isNaN(wagerEth) ) {
          alert("Plese set your wager!")
    }else {
      //convert to wei
      let config = {
        value: web3.utils.toWei(wagerEth, "ether")
      };
      // flip coin and fetch result
      betFlipInst.methods.queryRandom()
      .send(config);

      // listen to Event generatedRandomNumber
       betFlipInst.events.generatedRandomNumber()
       .on('data', function(event){
         won = event.returnValues.randomNumber;
         console.log("Won?: " + won);
       //}).then(function() {
         // display info and set wager to zero
         $("#wager_input").val("");
         if (won) {
           $('#lose_output').hide();
           $('#win_output').fadeIn(500);
         }else{
           $('#win_output').hide();
           $('#lose_output').fadeIn(500);
         }
           updateBalance();
       });
       // https://web3js.readthedocs.io/en/v1.2.0/web3-eth-contract.html#events

       // TODO: Listen on errors and show message

    } // wager > 0 && wagerETH is Number
}

function withdraw() {
  betFlipInst.methods.withdrawPlayerBalance()
    .send()
    .on('receipt', function(receipt) {
      console.log(receipt);
      updateBalance();
    });
}

function updateBalance() {
  betFlipInst.methods.getPlayerBalance()
      .call()
      .then(function(res) {
        let funds = web3.utils.fromWei(res, "ether")
          $('#fund_output').text(funds);
      });
}
