// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License v3. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//URL FOR TEST RESULTS: https://script.google.com/a/macros/bkshift.com/s/AKfycby3TGiZ_jVpfdy5b2nP6QZ8r6kAAWVjqaXqlm6GI8M/dev

//** CALLING FUNCTIONS *//

QUnit.helpers(this);

function doGet(e) {
  QUnit.urlParams( e.parameter );
  QUnit.config({ title: "Unit tests for BKS Scheduler scripts" });
  QUnit.load(tests);
  return QUnit.getHtml();
};

function tests(){
  // testSortByDate();
  testGetInvoiceTitle();
  testInvoiceMethods();
};


//** TESTS **//

function testGetInvoiceTitle(){
  var dates = {
    md: new Date(2014, 4, 12), //tests week from 5/5 - 5/11
    mmd: new Date(2014, 9, 13), //tests week from 10/6 - 10/12
    mdd: new Date(2014, 4, 19), //tests week from 5/12 - 5/18
    mmdd: new Date(2014, 9, 20) //tests week from 10/13 - 10/19
  };
  test('get invoice tittle (M/D)', function(){
    var title = getInvoiceTitle(dates[md]),
      expectedTitle = 'RestaurantInvoices_2014_0505_0511';
    equal(title, expectedTitle, 'Creates correct invoice title for 1-digit month w/ 1-digit day');
  });
  test('get invoice tittle (MM/D)', function(){
    var title = getInvoiceTitle(dates[mmd]),
      expectedTitle = 'RestaurantInvoices_2014_1006_1012';
    equal(title, expectedTitle, 'Creates correct invoice title for 2-digit month w/ 1-digit day');
  });
  test('get invoice tittle (M/DD)', function(){
    var title = getInvoiceTitle(dates[mdd]),
      expectedTitle = 'RestaurantInvoices_2014_0512_0518';
    equal(title, expectedTitle, 'Creates correct invoice title for 1-digit month w/ 2-digit day');
  });
  test('get invoice tittle (MM/DD)', function(){
    var title = getInvoiceTitle(dates[mdd]),
      expectedTitle = 'RestaurantInvoices_2014_1013_1019';
    equal(title, expectedTitle, 'Creates correct invoice title for 2-digit month w/ 2-digit day');
  });
};

function testInvoiceMethods(){
  
  var now = new Date(),
    thisMon = now.getWeekMap().mon,
    lastMon = thisMon.incrementDate(-7),
    lastWeek = lastMon.getWeekMap(),
    invoicesSheet = new Sheet(getSsKey('invoices'), 'index'),//Sheet 
    p = {
      now: now, //Date
      invoicePrintoutSheet: new Sheet('1bCb_k9JqaWY59uT7wuA2bNJOHneppL0s9Eg1zzwXPfA', 'index'),//Sheet
      invoicesSheet: invoicesSheet,//Sheet
      restaurantsSheet: new Sheet(getSsKey('restaurants'), 'info'),//Sheet
      balancesSheet: new Sheet(getSsKey('restaurants'), 'balances'),//Sheet
      invoices: new Invoices(invoicesSheet),//Invoices
      week: lastWeek,//Date.weekMap
    },
    chargeScenarios = getChargeScenarios(p);
  Logger.log('p.week.mon: ' + p.week.mon);
  testInvoiceWriteToModel(chargeScenarios, p);
  testInvoiceUpdateBalance(chargeScenarios.vanilla, p);

};

function testInvoiceWriteToModel(chargeScenarios, p){
  p.restaurant = chargeScenarios.vanilla.restaurant;
  Logger.log('p.restaurant.name: ' + p.restaurant.name);
  p.shifts = chargeScenarios.vanilla.shifts;
  Logger.log('p.shifts.length: ' + p.shifts.length);
  var lastRow = p.invoicesSheet.g.getLastRow(),
    invoice = new Invoice(p);
  invoice.writeToModel();
    var newLastRow = p.invoicesSheet.row.getLast();
  test('Invoice.writeToModel() appends a new row to the Invoices model', function(){
    equal(lastRow + 1, newLastRow, 'new row appended');
  });
  _.each(chargeScenarios, function(scenario, scenarioName){
    p.restaurant = scenario.restaurant;
    p.shifts = scenario.shifts;
    createInvoice(p);
    var invoice = new Invoice(p);
    invoice.writeToModel();
    var row = invoicesSheet.row.getLast(),
      col = invoicesSheet.getColNum('charge'),
      charge = invoicesSheet.getCell(row, col).toFixed(2),
      expectedCharge = scenario.expectedCharge;
    test('Invoice.writeToModel() creates correct charges for scenario: ' + scenarioName, function(){
      equal(charge, expectedCharge, 'correct chrage for ' + scenarioName);
    });
  });
};

function testInvoiceUpdateBalance(scenario, p){
  p.restaurant = scenario.restaurant;
  p.shifts = scenario.shifts;
  var invoice = new Invoice(p);
  invoice
    .updateBalance()
    .refreshBalancesSheet();
  test('Invoice.updateBalance() updates charges value correctly', function(){
    var charges = invoice.balance.charges.toFixed(2),
      expectedCharges = (charges + invoice.charges.charge).toFixed(2);
    equal(charges, expectedCharges, 'charges updated correctly');
  });
  test('Payment.updateBalance() updates last charge correctly', function(){
    var date = invoice.balance.lastCharge.toDateString(),
      expectedDate = invoice.dateProcessed.toDateString();
    Logger.log('expectedDate' + expectedDate);
    equal(date, expectedDate, 'last charge updated correctly');
  });
};

function testPaymentUpdateBalance(payment){
  payment
    .updateBalance()
    .refreshBalancesSheet();
  test('Payment.updateBalance() updates payments value correctly', function(){
    var payments = payment.balance.payments.toFixed(2),
      expectedPayments = (payments + payment.amount).toFixed(2);
    equal(payments, expectedPayments, 'payments updated correctly');
  });
  test('Payment.updateBalance() updates last payment correctly', function(){
    var date = payment.balance.lastPayment.toDateString(),
      expectedDate = payment.dateProcessed.toDateString();
    Logger.log('expectedDate' + expectedDate);
    equal(date, expectedDate, 'last payment updated correctly');
  });
};

  function getChargeScenarios(p){
    var mileEndBkk = p.restaurantsSheet.data[64],
      mileEndManhattt = p.restaurantsSheet.data[65],
      start = new Date(p.week.mon.getFullYear(), p.week.mon.getMonth(), p.week.mon.getDate(), 11),
      end = new Date(p.week.mon.getFullYear(), p.week.mon.getMonth(), p.week.mon.getDate(), 17);
    return {
      vanilla: {
        restaurant: mileEndBkk,
        shifts: [{
          riderid: 0,
          start: start,
          end: end,  
          status: 'confirmed',   
          billing: 'normal' 
        }],
        expectedCharge: '10.00'
      },
      tax: {
        restaurant: mileEndManhattt,
        shifts: [{
            riderid: 0, 
            start: start,
            end: end, 
            status: 'confirmed',   
            billing: 'normal'
        }],
        expectedCharge: '10.89'
      },
      discount: {
        restaurant: mileEndBkk,
        shifts: getDiscountShifts(start, end),
        expectedCharge: '100.00'
      },
      extraRider: {
        restaurant: mileEndBkk,
        shifts: [{
          riderid: 0, 
          start: start,
          end: end, 
          status: 'confirmed',   
          billing: 'normal'
        },{
          riderid: 1,
          start: start.incrementDate(1),
          end: end.incrementDate(1),
          status: 'confirmed',
          billing: 'extra rider'
        }],
        expectedCharge: '15.00'
      },
      emergencyExtraRider: {
        restaurant: mileEndBkk,
        shifts: [{
          riderid: 0, 
          start: start,
          end: end, 
          status: 'confirmed',   
          billing: 'normal'
        },{
          riderid: 1,
          start: start.incrementDate(1),
          end: end.incrementDate(1),
          status: 'confirmed',
          billing: 'extra rider emergency'
        }],
        expectedCharge: '20.00'
      },
      free: {
        restaurant: mileEndBkk,
        shifts: [{
          riderid: 0, 
          start: start,
          end: end, 
          status: 'confirmed',   
          billing: 'normal'
        },{
          riderid: 1,
          start: start.incrementDate(1),
          end: end.incrementDate(1),
          status: 'confirmed',
          billing: 'free'
        }],
        expectedCharge: '10.00'
      } 
    };
  };

  function getDiscountShifts(start, end){
    var shifts = [];
    _(11).times(function(n){
      Logger.log('start: ' + start);
      var num = getRandomInt(0,6);
      shifts.push({
        riderid: num,  
        start: start.incrementDate(num),
        end: end.incrementDate(num),            
        status: 'confirmed',   
        billing: 'normal'
      });
    });
    return shifts;
  };

function testSortByDate(view){
  var nums = [1,2,3], 
    startDates = nums.map(function (a) {return createStart(a, 'date');}),
    endDates = nums.map(function (a) {return createEnd(a, 'date');}), 
    startHours = nums.map(function (a) {return createStart(a, 'hour');}),
    endHours = nums.map(function (a) {return createEnd(a, 'hour');});

  Logger.log('startDates: ' + startDates);

  var descDates = getRecs(startDates, endDates, 'descending'),
    ascDates = getRecs(startDates, endDates, 'ascending'),
    ascHours = getRecs(startHours, endHours, 'ascending'),
    descHours = getRecs(startHours, endHours, 'descending');
  
  test('sort dates from descending to ascending', function(){
    deepEqual(sortByDate(descDates), ascDates, 'Dates in descending order sorted to ascending order.');
  });

  test('sort same day but different hours from descending to ascending', function(){
    deepEqual(sortByDate(descHours), ascHours, 'Hours in descending order sorted to ascending order.')
  });
  
  // function createStartDate(num){
  //   createStart(num, 'date');
  // };

  function createStart(num, mod){
    Logger.log('running createStart('+num+', '+mod+')');
    var ret = mod === 'date' ? new Date(2014, 1, num, 1) : new Date(2014, 1, 1, num);
    Logger.log('ret: ' + ret);
    return ret;
  };

  function createEnd(num, mod){
    return mod === 'date' ? new Date(2014, 1, num, 2) : new Date(2014, 1, 1, num);
  };

  function getRecs(starts, ends, sort){
    var recs = [];
    if (sort === 'ascending'){
      for (var i = 0; i < starts.length; i++) {
        createRec(starts[i], ends[i], recs);
      };
    } else if (sort === 'descending'){
      for (var i = starts.length - 1; i >= 0; i--) {
        createRec(starts[i], ends[i], recs);
      };
    }
    return recs;

    function createRec(start, end, recs){
      recs.push({
        id: 0,
        start: start,
        end: end,
        restaurantid: 4,
        riderid: 1
      });
    };
  };
};



//** FUNCTIONS UNDER TEST **//

function sortByDate (recs){
  recs.sort(function(a,b){
    if (a.start.getTime() < b.start.getTime()){return -1;}
    if (a.start.getTime() > b.start.getTime()){return 1;}
  });
  return recs;
};
