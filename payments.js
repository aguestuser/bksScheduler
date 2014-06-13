function recordPayment(e){
  var ir = ir = e.response.getItemResponses(); 
    p ={
      restaurant: getResponseByItemTitle(ir, 'Restaurant'),
      dateProcessed: new Date(),
      amount: getResponseByItemTitle(ir, 'Amount Paid'),
      method: getResponseByItemTitle(ir, 'Payment Method'),
      checkNumber: getResponseByItemTitle(ir, 'Check Number'),
      invoicesClaimed: getResponseByItemTitle(ir, 'Invoices Claimed')
      restaurantsSheet = new Sheet(getSsKey('restaurants'), 'info'),
      paymentsSheet = new Sheet(getSsKey('payments'), 'index'),
      balancesSheet = new Sheet(getSsKey('restaurants'), 'balances')
    },
    payment = new Payment(p);
  
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

function Payment(p){

  var self = this;

  //attrs
  this.id = p.paymentsSheet.data.length; //num
  this.model = p.paymentsSheet; //Sheet obj
  this.restaurantsSheet = p.restaurantsSheet;
  this.restaurant = getRestaurant(this.restaurantsSheet, p); //Restaurant obj
  this.balancesSheet = p.balancesSheet;
  this.balance =  getBalance(this.balancesSheet);//Sheet

  Logger.log("index of '$': " + p.amount.indexOf('$'));
  this.amount = p.amount.indexOf('$') > -1 ? Number(p.amount.replace('$', '')) : Number(p.amount); //num
  Logger.log(this.amount);
  this.previousBalance = Number(this.balance.balance); //num
  this.newBalance = this.previousBalance - this.amount; //num
  
  this.dateProcessed = p.dateProcessed; //Date
  this.method = p.method; //str
  this.checkNumber = Number(p.checkNumber); //num
  this.invoicesClaimed = p.invoicesClaimed; //str
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

  this.reconcileInvoices = function(amount){//input: Payment.amount, Payment.restaurant (Restaurant) Payment.balance (Balance), Payment. 
                                            //side effects: modify Invoice.paid values of appropriate invoices (set to true)
                                            //              modify Invoice.partiallyPaid values of appropriate invoices (set to true)
                                            //              record Invoice.partialPaymentAmount where appropriate
                                            //              modify Balance.unpaidInvoices for appropriate restaurant
                                            //              modify Balance.partiallyPaidInvoices for appropriate restaurant (if applicable)
                                            //              modify Balance.partialPaymentAmount for appropriate restaurant (if applicable)
    var invoices = new Invoices(this.invoicesSheet),
      invoicesPaid = invoices.paidBy(this.restaurant, this.amount),
      balances = new Balances(this.balancesSheet),
      balance = balances.forRestaurant(this.restaurant);


    _.each(invoicesPaid.inFull, function(invoice){
      if(invoice.paidInPart){invoice.forgetPartialPayment();}
      invoice.recordFullPayment(this.dateProcessed);
    });
    _.each(invoicesPaid.inPart, function(invObj){
      invObj.invoice.recordPartialPayment(this.date, invObj.partialPaymentAmount);
    });
  };
  // *purpose:*
  // take payment, 
  // determine which invoices it applies to, 
  // record which invoices have been paid in full, 
  // record which invoices have been partly paid,
  // generate list of invoices still not paid

  // *examples*
  // (A) Given that: Mile End, Broooklyn has the following set of invoices: {001: $10, 002: $10, 003: $10}
    // (1) a payment of $30 should:
    //    -> records full payment of all invoices
    //    -> records no invoices as partially paid
    //    -> records no partial payment amounts
    //    -> sets unpaid invoices to ''
    // (2) a payment of $20 should:
    //    -> records full payment of invoices 001 and 002
    //    -> records no partial payments
    //    -> records no partial payment amounts
    //    -> modifies unpaid invoices from '003'
    // (3) a payment of $15 should:
    //    -> records full payment of invoice 001
    //    -> records parital payment of invoice 002
    //    -> records partial payment amount of $5 for invoice 002
    //    -> sets unpaid invoices to '003' 
    //    -> sets partially paid invoices to '002'
    //    -> sets partial payment amount to $5
    // (4) a payment of $0 should:
    // (5) a payment of $40 should:

  //(B) Given that: Mile End, Manhatttan has the following set of invoices {0: $10, 1: $10} and invoice[0] has been paid in part with a partial payment amount of $5

  


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


