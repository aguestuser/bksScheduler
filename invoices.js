
View.prototype.createInvoices = function(){
  var self = this,
    now = new Date(),
    invoicesSheet = new Sheet(getSsKey('invoices'), 'index'),//Sheet 
    p = {
      now: now, //Date
      invoicePrintoutSheet: createInvoiceSheet(now),//Sheet
      invoicesSheet: invoicesSheet,//Sheet
      restaurantsSheet: new Sheet(getSsKey('restaurants'), 'info'),//Sheet
      balancesSheet: new Sheet(getSsKey('restaurants'), 'balances'),//Sheet
      invoices: new Invoices(invoicesSheet),//Invoices
      week: self.dates.weekMap,//Date.weekMap
      restaurant: {},//Restaurant
      shifts: [] //arr of Shifts
    },
    shiftsByRestaurant = subNamesForIds(self.recordsSortedByRef[0], self.refs[0].ids, self.refs[0].names); //Arr of Shifts
  
  moveFileToFolder(p.invoicePrintoutSheet.g.getParent().getId(), 'Restaurant Invoices');

  _.each(shiftsByRestaurant, function(shiftObj){
    Logger.log('creating invoice for restaurant: ' + shiftObj.name);
    if (shiftObj.id !== 27){//don't create invoices for Kulushkat
      p.restaurant = p.restaurantsSheet.data[shiftObj.id];//Restaurant obj
      p.shifts = shiftObj.shifts;//arr of Shifts
      createInvoice(p);      
    }
  });
    
  stickyToast('Invoices printed! See ' + p.invoicePrintoutSheet.g.getParent().getUrl());

};

function createInvoiceSheet(date){//input: Date; output: Sheet object; side-effects: moves Sheet object File to Invoices Folder
  var title = getInvoiceTitle(date), 
    ss = SpreadsheetApp.create(title),
    key = ss.getId()
  ss.getSheets()[0]
    .setName('index')
    .getRange(1,1)
      .setValue('INVOICES');
  var sheet = new Sheet(key, 'index');
  return formatNewInvoiceSheet(sheet);
};

function formatNewInvoiceSheet(sheet){
  var numCols = sheet.g.getLastColumn();
  for (var i = 1; i<8; i++){
    sheet.g.setColumnWidth(i, 74);
  }
  for (var i = 8; i < numCols+1; i++) {
    sheet.g.deleteColumn(i);
  };
  return sheet;
};

function getInvoiceTitle(date){//input: Date, output: Str ["RestaurantInvoicesYYYY_MMDD_MMDD"]
  var thisWeek = date.getWeekMap(),
    prevMon = thisWeek.mon.incrementDate(-7),
    prevSun = thisWeek.sun.incrementDate(-7),
    year = prevMon.getYear(),
    startStr = toMmDdString(prevMon),
    endStr = toMmDdString(prevSun);
  return 'RestaurantInvoices_'+year+'_'+startStr+'_'+endStr; 
};

function toMmDdString(date){
  return toTwoDigitString(date.getMonth()+1) + toTwoDigitString(date.getDate());
};

function toTwoDigitString(num){//input: num, output: str w/ length 2
  var str = num.toString();
  return str.length == 1 ? '0'+str : str;
};

function moveFileToFolder(fileId, folderName){//input: (Str, Str); output: none; side-effect: moves File obj to Folder obj
  var file = DriveApp.getFileById(fileId),
    folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()){var folder = folders.next();}
  folder.addFile(file);
};

function subNamesForIds(shiftsByRestaurant, ids, names){
  Logger.log('running subNamesForIds()');
  var newShifts = [];//Arr of Objs
  _.each(shiftsByRestaurant, function(shiftList, restaurantid){
    var index = ids.indexOf(Number(restaurantid)),
     restaurantName = names[index];
    newShifts.push({
      name: restaurantName,//str
      id: restaurantid,//num
      shifts: shiftList // Array of Shifts
    });    
  });
  newShifts.sort(function(a,b){
    if (a.name < b.name){return -1;}
    if (a.name > b.name){return 1;}
  });
  return newShifts;
};


function createInvoice(p){
  Logger.log('running createInvoice()');
  var invoice = new Invoice(p);
  p.invoices
    .add(invoice);
  invoice
    .writeToModel()
    .updateBalance()
    .print();
  p.invoicesSheet.refresh();
  p.balancesSheet.refresh();
  p.invoicePrintoutSheet.refresh();
  return invoice;
};


function Invoices(invoicesSheet){
  this.list = invoicesSheet.data;
  this.getCount = function(){
    return this.list.length;
  }
  this.add = function(invoice){
    this.list.push(invoice);
  };
};

function Invoice (p){
  
  var self = this;

  //attrs
  this.invoicePrintoutSheet = p.invoicePrintoutSheet;
  this.invoicesSheet = p.invoicesSheet;
  this.restaurantsSheet = p.restaurantsSheet;
  this.balancesSheet = p.balancesSheet;

  this.id = this.invoicesSheet.data.length;// num
  this.number = this.id + 1;// num
  
  this.restaurant = p.restaurant; // Restaurant obj
  this.weekStart = p.week.mon; //Date
  this.week = p.week; // Week
  this.dateIssued = p.now; // Date
  this.shifts = sortByDate(p.shifts); // arr of Shifts (sorted by date)
  this.balance = 0,//num
  this.charges = {}, // Charges
  this.paid =  false;// bool
  this.amountPaid = 0; // num

  //public methods

  this.getBalance = function(){
    return _.find(this.balancesSheet.data, function(bal){return bal.id == self.restaurant.id});
  };
  this.balance = this.getBalance();
  this.charges = new Charges(this.shifts, this.restaurant, this.balance);

  this.writeToModel = function(){
    Logger.log('running .writeToModel()');
    var rowObj = [{
        id: this.id, //num
        number: (this.id + 1), //num
        restaurant: this.restaurant.name, //str
        weekStart: this.week.mon.getFormattedDate(), //str
        dateIssued: this.dateIssued.getFormattedDate(), //str
        shiftids: _.pluck(this.shifts, 'id').join(', '), //str
        fees: this.charges.fees, //formatted num $##.##
        discount: this.charges.discount ? this.charges.discount :0, //formatted num
        revenue: this.charges.revenue, //num
        tax: this.charges.tax ? this.charges.tax : 0,//num
        charge: this.charges.charge, //num
        previousBalance: this.charges.previousBalance, //num
        newBalance: this.charges.newBalance
      }];
    Logger.log('rowObj values:');
    Logger.log(rowObj)
    _.each(rowObj[0], function(v, k){
      Logger.log(k +': ' + v);
    });
    var row = toRange(rowObj, this.invoicesSheet.headers);
    // Logger.log('row: ' + row);
    this.invoicesSheet.g.appendRow(row);
    this.refreshInvoicesSheet();
    return this;
  };



  this.updateBalance = function(){
    Logger.log('running .updateBalance()');
    var row = this.balancesSheet.getRowNum(this.balance.id),
      col = this.balancesSheet.getColNum('charges'),
      charges = Number(this.balance.charges) + Number(this.charges.charge);
    this.balancesSheet.updateCell(row, col, charges);

    col = this.balancesSheet.getColNum('lastCharge');
    this.balancesSheet.updateCell(row, col, this.dateIssued);

    this.refreshBalancesSheet();
    return this;
  };

  this.refreshInvoicesSheet = function(){
    this.invoicesSheet = new Sheet(this.invoicesSheet.id, 'index');
    return this;
  };

  this.refreshBalancesSheet = function(){
    this.balancesSheet = new Sheet(this.balancesSheet.id, this.balancesSheet.instance);
    this.balance = this.getBalance();
    return this;
  };

  this.refreshInvoicePrintoutSheet = function(){
    this.invoicePrintoutSheet = new Sheet(this.invoicePrintoutSheet.id, this.invoicePrintoutSheet.instance);
  };

  this.print = function(){
    Logger.log('running Invoice.print()');
    var sheet = this.invoicePrintoutSheet,
      firstRow = sheet.g.getLastRow() + 1, 
      filler = ['', '', '', '', '', '', ''], 
      charges = {normal: '$10.00', 'extra rider': '$5.00', 'extra rider emergency': '$10.00', 'free': '$0.00'},
      range = [];
    Logger.log('initialized local vars');

    var header = getHeader(self.restaurant, filler),
      titleRow = firstRow +2,
      addressRow = titleRow + 5,
      weekRow = addressRow + 4;
    range = range.concat(header);
    Logger.log('added headers');

    var ridersSheet = new Sheet(getSsKey('riders'), 'info'), 
      shiftList = getShiftList(this.shifts, ridersSheet, filler),
      shiftListStart = firstRow + header.length;
    range = range.concat(shiftList);
    Logger.log('added shift list');

    var sumsStart = firstRow + range.length,
      sums = getSums(self.charges, filler),
      totalRow = sumsStart + sums.length - 3,
      newBalanceRow = totalRow + 2;
    range = range.concat(sums);
    Logger.log('added sums')

    var footerStart = sumsStart + sums.length,
      unpaidInvoices = self.balance.unpaidInvoices, 
      footer = getFooter(this.restaurant, unpaidInvoices, filler);
    range = range.concat(footer);
    Logger.log('added footer');

    var targetRange = sheet.g.getRange(firstRow, 1, range.length, 7);
    Logger.log('firstRow: ' + firstRow);
    Logger.log('range.length: ' + range.length);
    targetRange.setValues(range);

    // sheet.appendRows(range);
    
    sheet.g//format black header row  
      .getRange(firstRow +1, 1, 1, 7)
        .setBackground('black');

    sheet.g //bold invoice #
      .getRange(titleRow, 1, 1, 2)
        .setFontWeight('bold');

    sheet.g //merge "For services rendered" line
      .getRange(titleRow +3, 1, 1, 7)
        .mergeAcross();

    sheet.g //merge restaurant address lines
      .getRange(titleRow + 5, 1, 3, 3)
        .mergeAcross();

    sheet.g //merge week listing lines
      .getRange(titleRow + 9, 1, 2, 2)
        .mergeAcross();
      
    sheet.g //bold week 
      .getRange(titleRow + 10, 1)
        .setFontWeight('bold');

    sheet.g //bold restaurant name
      .getRange(titleRow + 5, 1)
        .setFontWeight('bold');

    sheet.g //format shift list borders
      .getRange(shiftListStart, 1, shiftList.length, 7)
        .setBorder(true, true, true, true, false, false);

    sheet.g //format shift list header row 
      .getRange(shiftListStart, 1, 1, 7)
        .setBackground('grey')
        .setFontWeight('bold')
        .setBorder(true, true, true, true, false, false);

    sheet.g //left justify charges column
      .getRange(shiftListStart +1, 7, shiftList.length -1 + sums.length, 1)
        .setHorizontalAlignment('left');

    sheet.g //format total row
      .getRange(totalRow, 6, 1, 2)
        .setFontWeight('bold');

    sheet.g //format sums border
      .getRange(sumsStart, 6, sums.length, 2)
        .setBorder(true, true, true, true, false, false);

    sheet.g //right justify sum attributes
      .getRange(sumsStart, 6, sums.length, 1)
        .setHorizontalAlignment('right');

    sheet.g //format grand total row
      .getRange(newBalanceRow, 6, 1, 2)
        .setBackground('black')
        .setFontColor('white')
        .setFontWeight('bold');

    sheet.g //merge footer rows
      .getRange(footerStart +1, 1, footer.length -2, 7)
        .mergeAcross();

    sheet.g //bold unpaid invoices row
      .getRange(footerStart+1, 1)
        .setFontWeight('bold');

    sheet.g //left justify second column
      .getRange(firstRow, 2, range.length, 1)
        .setHorizontalAlignment('left');

    sheet.g //enable text-wrap on previous balance
      .getRange(footerStart -1, 6)
        .setWrap(true);

    sheet.g //enable text-wrap on new balance
      .getRange(footerStart -2, 6)
      .setWrap(true);

    return this;
  };



  //private methods
  function getId(count){//input: Invoices.count
                        //output: num
                        //side effects: increment Invoices.count
    var id = count;
    count++;
    return id;
  };

  function getHeader(restaurant, filler){
    var weekStr = self.week.mon.getFormattedDate() + ' - ' + self.week.sun.getFormattedDate(),
      range = [filler, filler];
      range.push(['Invoice #:', self.number, '', '', '', '', '']);
      range.push(['Issued on:', self.dateIssued.getFormattedDate(), '', '', '', '', '']);
      range.push(filler);
      range.push(['For services rendered by BK Shift to:', '', '', '', '', '', '']);
      range.push(filler);
      range.push([self.restaurant.name, '', '', '', '', '', '']);
      range.push([self.restaurant.address.slice(0, self.restaurant.address.indexOf(',')), '', '', '', '', '', '']);
      range.push([self.restaurant.address.slice(self.restaurant.address.indexOf(', ') + 2, self.restaurant.address.length), '', '', '', '', '', '']);
      range.push(filler);
      range.push(['During the week of:', '', '', '', '', '', '']);
      range.push([weekStr, '', '', '', '', '', '']);
      range.push(filler);
    return range;
  };

  function getShiftList(shifts, ridersSheet, filler){
    var range = [['Day', 'Date', 'Start', 'End', 'Rider', 'Rate', 'Charge']],
      charges = {
        normal: 10,
        'extra rider': 5,
        'extra rider emergency': 10,
        free: 0 
      };
    _.each(shifts, function(shift){
      Logger.log('in loop for shift id: ' + shift.id);
      var day = shift.start.getDayName(), 
        date = shift.start.getFormattedDate(), 
        start = shift.start.getFormattedTime(), 
        end = shift.end.getFormattedTime(),
        rider = shift.riderid ? ridersSheet.data[shift.riderid].name : '',
        rate = shift.billing,
        charge = charges[shift.billing].toDollars();
      if (shift.status.indexOf('cancelled') > -1){
        if (shift.status.indexOf('free') > -1){
          rider = 'cancelled';
        } else {
          rider = 'last minute cancelation';
        }
      }
      range.push([day, date, start, end, rider, rate, charge]);
    });
    return range
  };

  function getSums(charges, filler){
    var range = [];
    if (charges.discount > 0){
      range.push(['', '', '', '', '', 'Charges:', charges.fees.toDollars()]);
      range.push(['', '', '', '', '', 'Discount:', '-'+charges.discount.toDollars()]);  
    } 
    range.push(['', '', '', '', '', 'Subtotal:', charges.revenue.toDollars()]);
    range.push(['', '', '', '', '', 'Tax:', charges.tax.toDollars()]);
    range.push(['', '', '', '', '', 'Total:', charges.charge.toDollars()]);
    range.push(['', '', '', '', '', 'Previous Balance:', charges.previousBalance.toDollars()]);
    range.push(['', '', '', '', '', 'New Balance:', charges.newBalance.toDollars()]);
    return range;
  };

  function getFooter(restaurant, unpaidInvoices, filler){
    range = [filler];
    if (!unpaidInvoices){unpaidInvoices = 'none';}
    range.push(['Unpaid Invoices: ' + unpaidInvoices,'','','','','','']);
    range.push(filler);
    if (restaurant.paymentMethod == 'Check'){
      range.push(['Payment is accepted by check made payable to:','','','','','',''])
      range.push(filler);
      range.push(['BK Shift, LLC', '','','','','',''])
      range.push(['121 Carlton Ave., Ste. #2', '','','','','',''])
      range.push(['Brooklyn, NY 11205','','','','','',''])
      range.push(filler);
    } 
    if (restaurant.pickupRequired){
      var pickup = self.week.sun.incrementDate(2).getFormattedDate();
      str = 'Please prepare for pickup Tuesday ' + pickup + ' between 2pm and 6pm.';
      range.push([str, '','','','','',''])
      range.push(filler);
    }
    range.push(['We value your feedback! Please fill out our evaluation form at :', '','','','','','']);
    range.push(['http://bit.ly/bksrestaurantfeedback', '','','','','','']);
    range.push(filler);
    range.push(['Thank you for your business.', '','','','','','']);
    range.push(filler);
    return range;
  };

};

function Charges(shifts, restaurant, balance){
  
  var billings = _.pluck(shifts, 'billing'),
    counts = getCounts(billings),
    dif = getDif(counts);

  this.fees = getFees(shifts); // num
  
  this.discount = dif*10;// num
  this.revenue =  this.fees - this.discount;// num
  this.tax = restaurant.paymentMethod == 'Cash' ? 0 : this.revenue * .08875; // num
  this.charge = this.revenue + this.tax; //num
  this.previousBalance = balance.balance; // num
  this.newBalance =  balance.balance + this.charge;// num

  if (Number(restaurant.id) == 27){
    this.fees = 0;
    this.discount = 0;
    this.revenue = 0;
    this.tax = 0;
    this.charge = 0;
    this.previousBalance = 0;
    this.newBalance = 0;
  };

  function getCounts(billings){
    var counts = {normal: 0, extra: 0, extraEmer: 0};
    _.each(billings, function(b){
        if (b === 'normal'){counts.normal++;} else 
        if (b === 'extra rider'){counts.extra++;} else 
        if (b === 'extra rider emergency'){counts.extraEmer++};
    });
    return counts;
  };

  function getDif(counts){
    return counts.normal > 10 ? counts.normal - 10 : 0;
  };

  function getFees(shifts){//input: array of billings, output: num
    return counts.normal*10 + counts.extraEmer*10 + counts.extra*5;
  };
};