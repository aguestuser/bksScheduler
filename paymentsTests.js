// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License v3. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//URL FOR TEST RESULTS: 

//** CALLING FUNCTIONS *//

QUnit.helpers(this);

function doGet(e) {
  QUnit.urlParams( e.parameter );
  QUnit.config({ title: "Unit tests for Payment processing scripts" });
  QUnit.load(tests);
  return QUnit.getHtml();
};

function tests(){
  testPaymentMethods();
};

function testPaymentMethods(){
  Logger.log('running testPaymentMethods()');
  var restaurantsSheet = new Sheet(getSsKey('restaurants'), 'info'),
    paymentsSheet = new Sheet(getSsKey('payments'), 'index'),
    balancesSheet = new Sheet(getSsKey('restaurants'), 'balances'), 
    p = {
      restaurant: 'Mile End, Broooklyn',
      dateProcessed: new Date(),
      amount: '$54.44',
      method: 'Check',
      checkNumber: '100',
      invoicesClaimed: '100, 101'
    };
  var payment = new Payment(p, restaurantsSheet, paymentsSheet, balancesSheet);
  testPaymentWriteToModel(p, payment);
  testPaymentUpdateBalance(payment);
};

function testPaymentWriteToModel(p, payment){
  Logger.log('running testPaymentWriteToModel()')
  var lastRow = payment.model.row.getLast();
  payment.writeToModel();
  test('Payment.writetoModel() appends row', function(){
    var newLastRow = payment.model.row.getLast();
    equal(lastRow +1, newLastRow, 'row appended successfully.')
  });
  _.each(p, function(v, k){
    var row = payment.model.row.getLast(),
      col = payment.model.getColNum(k),
      actualValue = payment.model.getCell(row, col).toString(),
      expectedValue = v.toString().replace('$', '');
    test('Payment.writeToModel() writes correct '+k+' value', function(){
      equal (actualValue, expectedValue, v + ' written successfully.');
    });    
  });
};

function testPaymentUpdateBalance(payment){
  payment
    .updateBalance()
    .refreshBalancesSheet();
  test('Payment.updateBalance() updates payments value correctly', function(){
    var payments = payment.balance.payments.toFixed(2),
      expectedPayments = payment.newBalance.toFixed(2);
    equal(payments, expectedPayments, 'payments updated correctly');
  });
  test('Payment.updateBalance() updates last payment correctly', function(){
    var date = payment.balance.lastPayment.toDateString(),
      expectedDate = payment.dateProcessed.toDateString();
    Logger.log('expectedDate' + expectedDate);
    equal(date, expectedDate, 'last payment updated correctly');
  });
};