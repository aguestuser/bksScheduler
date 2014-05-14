function recordPayment(e){
  var ir = ir = e.response.getItemResponses(); 
    p ={
      restaurant: getResponseByItemTitle(ir, 'Restaurant'),
      dateProcessed: new Date(),
      amount: getResponseByItemTitle(ir, 'Amount Paid'),
      method: getResponseByItemTitle(ir, 'Payment Method'),
      checkNumber: getResponseByItemTitle(ir, 'Check Number'),
      invoicesClaimed: getResponseByItemTitle(ir, 'Invoices Claimed')
    },
    restaurantsSheet = new Sheet(getSsKey('restaurants'), 'info'),
    paymentsSheet = new Sheet(getSsKey('payments'), 'index'),
    balancesSheet = new Sheet(getSsKey('restaurants'), 'balances'),
    payment = new Payment(p, restaurantsSheet, paymentsSheet, balancesSheet);
  
  payment
    .writeToModel()
    .updateBalance();
};

function getResponseByItemTitle(ir, title){
  for (var i = 0; i < ir.length; i++) {
    if (ir[i].getItem().getTitle() === title){
      return ir[i].getResponse();
    }
  }
};

function Payment(p, restaurantsSheet, paymentsSheet, balancesSheet){

  var self = this;

  //attrs
  this.id = paymentsSheet.row.getLast(); //num
  this.model = paymentsSheet; //Sheet obj
  this.restaurantsSheet = restaurantsSheet;
  this.restaurant = getRestaurant(this.restaurantsSheet, p); //Restaurant obj
  this.balancesSheet = balancesSheet;
  this.balance =  getBalance(this.balancesSheet);//Sheet

  Logger.log("index of '$': " + p.amount.indexOf('$'));
  this.amount = p.amount.indexOf('$') > -1 ? Number(p.amount.replace('$', '')) : Number(p.amount); //num
  Logger.log(this.amount);
  this.previousBalance = Number(this.balance.balance); //num
  this.newBalance = this.previousBalance + this.amount; //num
  
  this.dateProcessed = p.dateProcessed; //Date
  this.method = p.method; //str
  this.checkNumber = Number(p.checkNumber); //num
  this.invoicesClaimed = p.invoicesClaimed; //arr
  this.invoicesPaid = getInvoicesPaid(); //arr of Invoices

  //public methods
  this.writeToModel = function(){
    var paymentObj = [{
        id: this.id,
        dateProcessed: this.dateProcessed,
        restaurant: this.restaurant.name,
        amount: this.amount,
        previousBalance: this.previousBalance,
        newBalance: this.newBalance,
        method: this.method,
        checkNumber: this.checkNumber,
        invoicesClaimed: this.invoicesClaimed,
        invoicesPaid: this.invoicesPaid.join()
      }],
      range = toRange(paymentObj, this.model.headers);
    this.model.g.appendRow(range);
    return this;
  };
  
  this.updateBalance = function (){//side-effects: changes Balance.payments, Balance.lastPayment
    var sheet = this.balancesSheet, 
      payments = Number(this.balance.payments) + this.amount,
      row = this.balance.id + 2,
      paymentsCol = sheet.getColNum('payments'),
      lastPaymentCol = sheet.getColNum('lastPayment');
    sheet
      .updateCell(row, paymentsCol, payments)
      .updateCell(row, lastPaymentCol, this.dateProcessed);
    return this;
  };

  this.refreshBalancesSheet = function(){
    this.balancesSheet = new Sheet(getSsKey('restaurants'), 'balances');
    this.balance = getBalance(this.balancesSheet);
    return this;
  };


  //private methods

  function getInvoicesPaid(){//input: Sheet, output: arr of Invoices; side-effects: change status of Invoice.paid from FALSE to TRUE
    return [];
    // var unpaidInvoices = _.where(invoicesSheet.data, paid: false);
    // _.each(unpaidInvoices, function(invoice){

    // });
  };

  function getRestaurant(rSheet, p){//input: Sheet obj, params obj; output: Restaurant obj
    return _.find(rSheet.data, function(r){return r.name === p.restaurant});
  };

  function getBalance(bSheet){//input: Sheet obj; output: Balance obj
    return _.find(bSheet.data, function(b){return b.id === self.restaurant.id});
  };


};


