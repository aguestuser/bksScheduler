function getBalances(){
  var 
};

function Balance(balances, initBalance, restaurantid, date){ //inputs: (arr of Balances, num, Date)
                                                //outputs: new Balance
                                                //side effects: add new Balance to arr of Balances
  this.id = balances.length; //num
  this.restaurantid = restaurantid; //num
  this.updated = date; //Date

  this.totalCharges = getCharges(this.restaurantid); //num
  this.totalPayments = getPayments(this.restaurantid); //num
  this.balance = this.totalCharges - this.totalPayments; //num

  balances.push(this);

  //private methods
  function getCharges(restaurantid, initBalance){
    var invoices = new Sheet(getSsKey('invoices'), 'index'),
      charges = _.pluck(invoices, 'charge'),
      totalCharges = _.inject(charges, function(sum, charge){return sum + charge}, initBalance);
    return totalCharges;
  };

  function getPayments(restaurantid){
    var paymentSheet = new Sheet(getSsKey('payments'), 'index'),
      payments = _.pluck(paymentSheet, 'payment amount'),
      totalPayments = _.inject(payments, function(sum, payment){return sum + payment}, 0);
    return totalPayments;
  };

  //public methods
};