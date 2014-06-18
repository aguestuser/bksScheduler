// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License v3. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

function handleSubmission(e) {
  var ir = e.response.getItemResponses(),
    ir_ = parseIr(ir),
    date = new Date(),
    key = getSsKey('restaurants');
    sheets = {
      info: new Sheet(key, 'info'),
      workConditions: new Sheet(key, 'workConditions'),
      scheduleNeeds: new Sheet(key, 'scheduleNeeds'),
      metrics: new Sheet(key, 'metrics'),
      balances: new Sheet(key, 'balances') 
    };
  handleStaffEmails(ir);
  handleOwnerEmail(ir_);
  handleDatabaseSubmit(ir_, date, sheets);
};

function parseIr(ir){
  var ir_ = {};
  _.each(ir, function (ir) {
    ir_[ir.getItem().getTitle()] = ir.getResponse();
  });
  return ir_;
};

function handleStaffEmails(ir){
  var name = getResponseByItemTitle(ir, 'Restaurant Name'),
    body = getStaffEmailBody(ir),
    // recipients = ['bkshifttester@gmail.com'],//testing
    recipients = ['austin@bkshift.com', 'tess@bkshift.com', 'yagil@bkshift.com', 'justin@bkshift.com'],//live
    ep = {
      name: 'SYS ADMIN',
      to: '',
      subject: '[RESTAURANT REGISTRATION] ' + name,
      htmlBody: body
    };
  sendEmails(recipients, ep);
};

function getResponseByItemTitle(ir, title){
  for (var i = 0; i < ir.length; i++) {
    if (ir[i].getItem().getTitle() === title){
      return ir[i].getResponse();
    }
  }
};

function getStaffEmailBody(ir){
  var header = '<p>You received the following restaurant registration: </p>',
    footer = "<p><ol><strong>REMEMBER -- WE STILL NEED TO:</strong>\
        <li>Add the restaurant to the <a href='https://docs.google.com/a/bkshift.com/forms/d/1w9u7eDRP1Ux7lBHiinUfM8_3_eBAcnwcIog2W-dfT5k/edit'>payment processing form</a></li>\
        <li>Add a brief to the <a href='https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE'>restaurants model</a></li>\
        <li>Create a <a href='https://www.google.com/calendar/b/2/render'>calendar</a> for the restaurant</li>\
      </ol></p>";
    data = [];
  for (var i = 0; i < ir.length; i++) {
    var pre = getPrefix(i);
    data.push(pre + '<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function getPrefix(i){
  switch(i){
    case 0: //name
      return '<p><strong><span style="text-decoration: underline;">CONTACT INFO:</span></strong><br/>';
    case 5: //street address
      return '</p><p><strong><span style="text-decoration: underline;">LOCATION:</span></strong><br/>';
    case 8: //zone size
      return '</p><p><strong><span style="text-decoration: underline;">WORK REQUIREMENTS:</span></strong><br/>';
    case 14: //shifts needed
      return '</p><p><strong><span style="text-decoration: underline;">SCHEDULING REQUIREMENTS:</span></strong><br/>';
    case 18: //rider payment method
      return '</p><p><strong><span style="text-decoration: underline;">RIDER PAYMENT:</span></strong><br/>';
    case 22: //equipment
      return '</p><p><strong><span style="text-decoration: underline;">RIDER EQUIPMENT:</span></strong><br/>';
    case 23: //agency payment method
      return '</p><p><strong><span style="text-decoration: underline;">RELATIONSHIP WITH AGENCY:</span></strong><br/>';
    default:
      return '';
  }
};

function handleOwnerEmail(ir_){
  var name = properNounify(ir_['Contact Person Name']),
    email = ir_['Contact Person Email'],
    body = getOwnerEmailBody(name),
    recipients = [email],
    ep = {
      name: 'Yagil Kadosh, BK Shift',
      to: '',//will be filled in by passing recipients to sendEmails()
      replyTo: 'yagil@bkshift.com',
      subject: 'Thanks for registering with BK Shift!',
      htmlBody: body
    }
  sendEmails(recipients, ep);
};

function getOwnerEmailBody(name){
  var salutation = "<p/>Dear "+name+":</p>",
    message = "<p>Thanks for registering with BK Shift. We look forward to providing you with quality, reliable service. If you ever have any questions about our services or would like to make changes to your weekly schedule, please feel free to email me at yagil@bkshift.com or text or call at (201) 341-9442.</p>";
    signature = "<p>Best,</p>\
    <p>Yagil Kadosh,<br/>\
    Director of Partner Relations<br/>\
    BK Shift, LLC</p>";
  return salutation + message + signature;
};

function sendEmails(recipients, ep){
  for (var i = 0; i < recipients.length; i++){
    ep.to = recipients[i];
    MailApp.sendEmail(ep);
  }
};

// DATABASE SUBMISSION //

function handleDatabaseSubmit(ir_, date, sheets){ //input: formatted Array of Item Responses
                                    //output: bool 
                                    //side effects: build Translations and Sheet objs and pass them to formatSubmissions()    
  var address = formatAddress(ir_['Street Address'], ir_['Borough']),
    p = {
      name: properNounify(ir_['Restaurant Name']),
      address: address,
      geo: getGeocode(address),
      date: date
    },  
    translations = getTranslations(ir_, p);

  _.each(sheets, function(sheet, sheetName){
    var row = translateInput(ir_, translations[sheetName], sheet);
    sheet.g.appendRow(toRange([row], sheet.headers));
    if (sheetName == 'balances'){
      var rowNum = row.id +2,
        colNum = 6;
      appendBalanceFormula(sheet, rowNum, colNum);
    }
  });  
  return true;
};

function properNounify(str){
  var words = str.split(' '),
    newWords = [];
  _.each(words, function(word){
    newWords.push(word.charAt(0).toUpperCase() + word.substring(1));
  });
  var newStr = newWords.join(' ');
  return newStr;
};

function formatAddress(address, borough){ //input: Str, Str
                                          //output: formatted address Str
  var boroughMatches = address.match(/(brooklyn|manhattan|queens|bronx|staten island|nyc)/i);
  if (boroughMatches) {//remove everything but street address from street address field
    address = address.slice(0, address.indexOf(boroughMatches[0])-1).trim();
    if (address[address.length-1] == ','){
      address = address.slice(0, -1);
    }
  }
  if (borough == 'Manhattan'){borough = 'New York';}
  address = properNounify(address.concat(', '+borough+', NY'));
  return address;
};

function getGeocode(address){
  var response = Maps.newGeocoder().geocode(address);
  var geo = {};
  if (response.status == 'OK'){
    geo.lat = response.results[0].geometry.location.lat;
    geo.lng = response.results[0].geometry.location.lng;
  } else {
    geo.lat = 'ERROR: improperly formatted address';
    geo.lng = 'ERROR: improperly formatted address';
  }
  return geo;
};

function getTranslations(ir_, p){ //input: none
                            //output: Translations object literal 
  var translations = {
    info: {
      active: true,
      name: p.name,
      borough: properNounify(ir_['Borough']),
      neighborhood: properNounify(ir_['Neighborhood']),
      address: p.address,
      lat: p.geo.lat,
      lng: p.geo.lng,
      pointOfContact: properNounify(ir_['Contact Person Name']),
      email: ir_['Contact Person Email'],
      personalPhone: ir_['Contact Person Phone'], 
      restaurantPhone: ir_['Restaurant Phone'],
      brief: 'is a new account. Let us know how it goes!',
      dateAdded: p.date,
      status: 'new account',
      paymentMethod: ir_['Agency Payment Method'],
      pickupRequired: false
    },
    workConditions: {
      name: p.name,
      onTheBooks: irContains('Rider Payment Method', 'Check'),
      zone: ir_['Zone size'],
      daytimeVolume: ir_['Daytime volume'],
      eveningVolume: ir_['Nighttime volume'],
      paymentMethod: ir_['Rider Payment Method'],
      payRate: ir_['Rider Pay Rate'],
      shiftMeal: irContains('Shift Meal', 'Yes'),
      cashOutTips: irContains('Tip Payment', 'Yes'),
      riderOnPremises: irContains('On-premises service', 'Yes'),
      extraWork: irContains('Extra work', 'Yes'),
      extraWorkDescription: ir_['Extra work description'],
      bikeProvided: irContains('Equipment', 'Bike / scooter'),
      lockProvided: irContains('Equipment', 'Bike lock'),
      rackProvided: irContains('Equipment', 'Basket / rack'),
      bagProvided: irContains('Equipment', 'Delivery bag')
    },
    scheduleNeeds: {
      name: p.name,
      shiftsNeeded: ir_['Shifts needed'], 
      amHours: ir_['AM shift hours'],
      pmHours: ir_['PM shift hours'],
      comments: ir_['Schedule comments']
    },
    metrics: {
      name: p.name
    },
    balances: {
      name: p.name,
      initialBalance: 0,
      payments: 0,
      charges: 0
    }
  };
  return translations;

  //closure
  function irContains(index, substr){
    return ir_[index].indexOf(substr) == -1 ? false : true;  
  };
};

function translateInput(ir_, translations, sheet){ //input: Array of Item Responses, Translations obj, Array of Sheet objs
                                                //output: Obj literal of Sheet row (keys match Sheet.headers)
  var id = sheet.row.getLast() - sheet.row.first +1,
    rowNum = id + 2,
    row = {};
  _.each(sheet.headers, function (header){
    if (header in translations){
      row[header] = translations[header];
    } else if (header == 'id'){
      row.id = id;
    } else {
      row[header] = ir_[header.upperFirstChar()];
    }
  });
  return row; 
};

function appendBalanceFormula(sheet, rowNum, colNum){
  var range = sheet.g.getRange(rowNum, colNum);
  range.setFormula('=C'+rowNum+'-D'+rowNum+'+E'+rowNum);
  return true;
};