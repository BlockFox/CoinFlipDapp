import "./Ownable.sol";
import "./provableAPI_0.6.sol";

pragma solidity >=0.4.21 <0.7.0;


contract BetFlip is Ownable, usingProvable {

  /*************************************************************************
  * structs
  **************************************************************************/
  struct balances{
      uint256 balance;       //balance of Player
      uint256 wager;
      bytes32 queryID;       //query ID for random number
      bool waiting;       //true if no callback for random number received
  }

  struct addressesOfQueryID{
    address qIdAdress;
  }

  /*************************************************************************
  * variables and mappings
  **************************************************************************/
  uint private balanceSmartContract;
  address private playerAddresses;

  mapping (address => balances) playerBalance;
  mapping (bytes32 => addressesOfQueryID) queryAddress;

  /*************************************************************************
  * constants
  **************************************************************************/
  uint256 constant NUM_RANDOM_BYTES_REQUESTED = 1;
  uint256 constant QUERY_EXECUTION_DELAY = 0;
  uint256 constant GAS_FOR_CALLBACK = 200000;


  /*************************************************************************
  * events
  **************************************************************************/
  event LogNewProvableQuery(string description);
  event generatedRandomNumber(
    uint256 returnCode,
    uint256 randomNumber,
    string message
  );
  event TestRandomEvent(
    bytes32 queryID,
    string result,
    bytes proof
  );

  /*************************************************************************
  * Modifier
  **************************************************************************/
  modifier costs(uint256 val){
       require(msg.value >= val,
           "Please send more wei!");
       _; //Continue execution
   }


  /*************************************************************************
  * cosntructor
  **************************************************************************/


  /*************************************************************************
  * functions
  **************************************************************************/

  function queryRandom() payable public costs(GAS_FOR_CALLBACK + 1){
    require(balanceSmartContract >= ( msg.value - GAS_FOR_CALLBACK) * 2
      , "Smart Contract has not enough funds to cover the bet!");

    require(playerBalance[msg.sender].waiting == false
      , "Player must wait for the last bet.");


    playerBalance[msg.sender].queryID = provable_newRandomDSQuery(
        QUERY_EXECUTION_DELAY,
        NUM_RANDOM_BYTES_REQUESTED,
        GAS_FOR_CALLBACK
    );

      /* only for test purposes*/
    // playerBalance[msg.sender].queryID = fakeRandom();


    // update Player data
    playerBalance[msg.sender].wager = msg.value - GAS_FOR_CALLBACK;
    playerBalance[msg.sender].waiting = true;
    queryAddress[playerBalance[msg.sender].queryID].qIdAdress = msg.sender;

    emit LogNewProvableQuery(
      "Provable query was sent, standing by for the answer...");
  }


  function __callback(bytes32 _queryId, string memory _result
          , bytes memory _proof ) override public{

/* TODO decomment
    require(msg.sender == provable_cbAddress()
      , "Address not provable.");
*/
    uint256 randomNumber = 0;
    uint256 returnCode = 0;

    // provable_randomDS_proofVerify__returnCode(_queryId, _result, _proof);

    address playerAddress = queryAddress[_queryId].qIdAdress;
    string memory message;

    if ( returnCode != 0 ) {
      message = "Callback not succeed. Check return code";
    } else { // returnCode != 0
      randomNumber = uint256(keccak256(abi.encodePacked(_result))) % 2;

      if(randomNumber == 1) { // won
        playerBalance[playerAddress].balance +=
          2 * playerBalance[playerAddress].wager;

        balanceSmartContract -= playerBalance[playerAddress].wager;
        message = "Callback succeed. Player won!";

      } else {  // lose
        balanceSmartContract += playerBalance[playerAddress].wager;
        message = "Callback succeed. Player lose!";
      }
    }

    //delete player data
    playerBalance[playerAddress].queryID = 0;
    playerBalance[playerAddress].wager = 0;
    playerBalance[playerAddress].waiting = false;
    delete queryAddress[_queryId];

    emit generatedRandomNumber(returnCode, randomNumber, message);
  }

  /* withdrawPlayerBalance()
  * withdraw given ammount of ether to player address
  * sc balance must be reduced with amount of withdraswl
  */
  function withdrawPlayerBalance() public returns(uint){
    uint toTransfer = playerBalance[msg.sender].balance;
    playerBalance[msg.sender].balance = 0;
    msg.sender.transfer(toTransfer);
    return toTransfer;
  }

  /* getPlayerBalance()
  * return the balance from actual player address
  */
  function getPlayerBalance() public view returns(uint256){
    return playerBalance[msg.sender].balance;
  }

  function getPlayerWager() public view returns(uint256){
    return playerBalance[msg.sender].wager;
  }

  function getPlayerQueryID() public view returns(bytes32){
    return playerBalance[msg.sender].queryID;
  }

  function getPlayerWaiting() public view returns(bool){
    return playerBalance[msg.sender].waiting;
  }

  function getAdressOfQeryId() public view returns (address){
     return queryAddress[playerBalance[msg.sender].queryID].qIdAdress;
  }


  /* withdrawSCBalance()
  * withdraw given ammount of ether to player address
  * only the owner can withdraw sc funds
  * the maximum ammount of withrawl is balanceSC - all address balances
  */
  function withdrawSCBalance(uint ammount) public onlyOwner returns(uint) {
    balanceSmartContract -= ammount ;
    msg.sender.transfer(ammount);
    return ammount;
  }

  /* depositSC()
  * deposit given ammount of ether to smart contract
  * only the owner can deposit sc funds
  */
  function depositSC() public onlyOwner payable{
    balanceSmartContract += msg.value;
  }

  /* getBalanceSC()
  * return the balance of smart contract
  * only the owner can view it
  */
  function getBalanceSC() public view onlyOwner returns (uint) {
    return balanceSmartContract;
  }


  /* pseudoRandom
  * this was method for phase 1 of smartContract
  */
  function pseudoRandom() private view returns(uint){
    return now % 2;
  }

  /* fakeRandom
  *  this mehtod is used for phase 2 of smartContract for test purposes
  */
  function fakeRandom() private returns(bytes32){
    bytes32 queryID =
          bytes32(keccak256(abi.encodePacked(msg.sender)));
    string memory result;
    if(pseudoRandom() == 1) {
      result = "1";
    }
    else{
      result = "0";
    }

    emit TestRandomEvent(queryID, result, bytes("pseudoRandom"));

    return queryID;
  }

}
