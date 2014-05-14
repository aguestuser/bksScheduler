
View.prototype.createInvoices = function(){
  var self = this,
    now = new Date(now),
    invoicesSheet = new Sheet(getSsKey('invoices'), 'index'),//Sheet 
    p = {
      now: now, //Date
      invoicePrintoutSheet: createInvoiceSheet(now),//Sheet
      invoicesSheet: invoicesSheet,//Sheet
      restaurantsSheet: new Sheet(getSsKey('restaurants'), 'info'),//Sheet
      balancesSheet: new Sheet(getSsKey('restaurants'), 'balances'),//Sheet
      invoices: new Invoices(invoicesSheet),//Invoices
      week: self.dates.weekMap,//Date.weekMap
      shiftsByRestaurant: self.recordsSortedByRef[0]//Arr of Shifts
    };
  
  _.each(p.shiftsByRestaurant, function(shiftList, restaurantid){
    p.restaurant = p.restaurantsSheet.data[restaurantid];//Restaurant obj
    p.shifts = shiftList;//arr of Shifts
    createInvoice(p);
  });
    
  moveFileToFolder(p.invoicePrintoutSheet.getName(), 'RestaurantInvoices');
  stickyToast('Invoices printed! See ' + invoicePrintoutSheet.g.getParent().getUrl());
};

function createInvoice(p){
  var invoice = new Invoice(p);
  p.invoices
    .add(invoice);
  invoice
    .writeToModel()
    .updateBalance()
    .print();
  return invoice;
};

function createInvoiceSheet(date){//input: Date; output: Sheet object; side-effects: moves Sheet object File to Invoices Folder
  var title = getInvoiceTitle(date), 
    ss = SpreadsheetApp.create(tile),
    key = ss.getId(),
    sheet = new Sheet(key, 'index');
};

function moveFileToFolder(fileName, folderName){//input: (Str, Str); output: none; side-effect: moves File obj to Folder obj
  var file = DriveApp.getFileByName(fileName),
    folder = DriveApp.getFolderByName(folderName);
  folder.add(file);
};

function getInvoiceTitle(date){//input: Date, output: Str ["RestaurantInvoicesYYYY_MMDD_MMDD"]
  var thisWeek = date.getWeekMap(),
    prevMon = thisWeek.mon.incrementDate(-7),
    prevSun = thisWeek.sun.incrementDate(-7),
    year = prevMon.getYear(),
    startStr = toMmDdString(prevMon),
    endStr = toMmDdString(prevSun);
  return 'RestaurantInvoices'+year+'_'+startStr+'_'+endStr; 
};

//see tests.js/testGetInvoiceTitle() for test of above function

function toMmDdStr(date){
  return toTwoDigitString(date.getMonth()+1) + toTwoDigitString(date.getDate());
};

function toTwoDigitString(num){//input: num, output: str w/ length 2
  var str = num.toString();
  return str.length == 1 ? '0'+str : str;
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
  this.shifts = p.shifts; // arr of Shifts
  this.balance = getBalance(this.restaurant, this.balancesSheet),
  this.charges = new Charges(this.shifts, this.restaurant, this.balance);
  this.paid =  false;// bool
  this.amountPaid = 0; // num

  //public methods

  this.writeToModel = function(){
    var rowObj = [{
        id: this.id, //num
        number: (this.id + 1), //num
        restaurant: this.restaurant.name, //str
        week: this.week.mon.getFormattedDate() + '-' + this.week.sun.getFormattedDate(), //str
        dateIssued: this.dateIssued.getFormattedDate(), //str
        shifts: this.shifts.join(), //str
        fees: this.charges.fees, //formatted num $##.##
        discount: this.charges.discount, //formatted num
        revenue: this.charges.revenue,
        tax: this.charges.tax,
        charge: this.charges.charge,
        previousBalance: this.charges.previousBalance,
        newBalance: this.charges.currentBalance
      }];
    _.each(rowObj, function(k, v){
      Logger.log(k +': ' + v);
    });
    var row = toRange(rowObj);
    this.invoicesSheet.g.appendRow(row);
    return this;
  };

  this.updateBalance = function(balancesSheet){
    var row = balancesSheet.getRowNum(this.balance.id),
      col = balancesSheet.getColNum('charges'),
      charges = this.balance.charges + self.charge;
    balancesSheet.updateCell(row, col, charges);
    return this;
  };

  this.refreshBalancesSheet = function(){
    this.balancesSheet = new Sheet(getSsKey('restaurants'), 'balances');
    this.balance = getBalance(this.balancesSheet);
    return this;
  };

  this.print = function(sheet){
    var firstRow = sheet.getLastRow() + 1; 
      filler = ['', '', '', '', '', '', ''], 
      charges = {normal: '$10.00', 'extra rider': '$5.00', 'extra rider emergency': '$10.00', 'free': '$0.00'},
      range = [];
    
    var header = getHeader(self.restaurant, filler),
      addressRow = firstRow + 5;
    range.push(header);

    var ridersSheet = new Sheet(getSsKey('riders', 'info')), 
      shiftList = getShiftList(shifts, ridersSheet),
      shiftListStart = firstRow + header.length;
    range.push(shiftList);
      
    var sumsStart = firstRow + range.length,
      sums = getSums(self.charges),
      totalRow = sumsStart + sums.length - 3,
      grandTotalRow = totalRow + 2;
    range.push(sums);

    var footerStart = sumsStart + sums.length, 
      footer = getFooter(restaurant, filler);
    range.push(footer);

    sheet.appendRows(range)
    
    sheet//format black header row  
      .getRange(firstRow, 1, 1, 7)
        .setBackground('black');

    sheet //merge restaurant address cells
      .getRange(addressRow, 1, 3, 3)
      .mergeAcross();

    sheet //format shift list borders
      .getRange(shiftListStart, 1, shiftList.length, 7)
      .setBorder(true, true, true, true, false, false);

    sheet // format shift list header row 
      .getRange(shiftListStart, 1, 1, 7)
        .setBackground('grey')
        .setFontWeight('bold')
        .setBorder(true, true, true, true, false, false);

    sheet //format total row
      .getRange(totalRow, 6, 1, 2)
        .setFontWeight('bold');

    sheet //format grand total row
      .getRange(grandTotalRow, 6, 1, 2)
      .setBackground('black')
      .setFontColor('white')
      .setFontWeight('bold');

    sheet // merge footer cells 
      .getRange(footerStart, 1, footers.length, 7)
        .mergeAcross();


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
    var weekStr = self.dates.weekMap.mon.getFormattedDate() + ' - ' + self.dates.weekMap.sun.getFormattedDate(),
      range = [filler];
      range.push(['Invoice #', self.num, '', '', '', '', '']);
      range.push(filler);
      range.push(['For services rendered by BK Shift to:', '', '', '', '', '', '']);
      range.push([self.restaurant, '', '', '', '', '', '']);
      range.push([self.restaurant.address.slice(0, self.restaurant.address.indexOf(',') + 1)]);
      range.push([self.restaurant.address.slice(self.restaurant.address.indexOf(', ') + 1, self.restaurant.address.length)]);
      range.push(filler);
      range.push(['During the week of:', '', '', '', '', '', '']);
      range.push([weekStr, '', '', '', '', '', '']);
      range.push(filler);
    return range;
  };

  function getShiftList(shifts, shiftsSheet){
    var range = [['Day', 'Date', 'Start', 'End', 'Rider', 'Rate', 'Charge']],
      charges = {
        normal: 10,
        'extra rider': 5,
        'extra rider emergency': 10,
        free: 0 
      };
    _.each(shifts, function(shift){
      var day = shift.start.getDayName(), 
        date = shift.start.getFormattedDate(), 
        start = shift.start.getFormattedTime(), 
        end = shift.end.getFormattedTime,
        rider = shiftSheets.data[shift.riderid],
        rate = shift.rate,
        charge = charges[shift.billing];
      if (shift.status.indexOf('cancelled') > -1){
        if (shift.status.indexOf('free') > -1){
          rider = 'cancelled';
        } else {
          rider = 'last minute cancelation';
        }
      }
      range.push([day, date, start, end, rider, rate, charge.toDollars()]);
    });
    return range
  };

  function  getSums(charges){
    var range = [];
    range.push(['', '', '', '', '', 'Fees:', charges.fees.toDollars()]);
    if (charges.discount > 0){
      range.push(['', '', '', '', '', 'Discount:', charges.discount.toDollars()]);
      range.push(['', '', '', '', '', 'Subtotal:', charges.revenue.toDollars()]);
    }
    if (charges.tax > 0){
      range.push(['', '', '', '', '', 'Tax:', charges.tax.toDollars()]);
      range.push(['', '', '', '', '', 'Total: ', charges.charge.toDollars()]);
    }
    range.push(['', '', '', '', '', 'Previous Balance:', charges.balance.toDollars()]);
    range.push(['', '', '', '', '', 'Grand Total:', charges.totalOwed.toDollars()]);
  };

  function getFooter(restaurant, filler){
    range = [filler];
    if (restaurant.paymentMethod == 'check'){
      range.push(['Payment is accepted by check made payable to:','','','','','',''])
      range.push(['BK Shift, LLC', '','','','','',''])
      range.push(['121 Carlton Ave., Ste. #2', '','','','','',''])
      range.push(['Brooklyn, NY 11205'])
      range.push(filler);
    } 
    if (restaurant.pickupRequired){
      var date = new Date();
      if (date.getDayName == 'Sunday'){date = date.incrementDate(1);}
      var weekMap = date.getWeekMap();
      str = 'Please prepare for pickup Tuesday, ' + weekMap.tue.getFormattedDate() + 'between 2pm and 6pm.';
      range.push([str, '','','','','',''])
      range.push(filler);
    }
    range.push(['We value your feedback! Please fill out our evaluation form at :'])
    range.push(['http://bit.ly/bksrestaurantfeedback'])
    range.push(filler)
    range.push(['Thank you for your business', '','','','','','']);
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
    return counts.normal*10 - dif + counts.extraEmer*10 + counts.extra*5;
  };
};

function getBalance(restaurant, balancesSheet){
  return _.find(balancesSheet.data, function(bal){return bal.id == restaurant.id});
};