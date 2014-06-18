// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License v3. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//URL FOR TEST RESULTS: https://script.google.com/a/macros/bkshift.com/s/AKfycbwatWLOqn1Ug5hSUhnS2tJetxum6FodfzUtSDBNR-Y/dev

//** CALLING FUNCTIONS *//

QUnit.helpers(this);

function doGet(e) {
  QUnit.urlParams( e.parameter );
  QUnit.config({ title: "Unit tests for BKS Restaurant Registration Form scripts" });
  QUnit.load(tests);
  return QUnit.getHtml();
};

function tests(){
  testProperNounify();
  testFormatAddress();
  testGetGeocode();
  testHandleDatabaseSubmit();
};

// add underscore and GasUnit!

function testProperNounify(){
  var strings = ['Already Capitalized', 'not capitalized', 'has 1 number', 'partway capitalized', 'includes a short word'],
    expected = ['Already Capitalized', 'Not Capitalized', 'Has 1 Number', 'Partway Capitalized', 'Includes A Short Word'],
    actual = _.map(strings, function(string){
    return properNounify(string);
  });
  test('properNounify() correctly capitalizes strings', function(){
    deepEqual(actual, expected);
  })
};

function testFormatAddress(){
  var addresses = ['1407 dean st', '1407 dean st, brooklyn ny', '1407 dean st brooklyn'],
    expected = ['1407 Dean St, Brooklyn, NY', '1407 Dean St, Brooklyn, NY', '1407 Dean St, Brooklyn, NY'];
    actual = _.map(addresses, function(address){
      return formatAddress(address, 'brooklyn');
    });
  test('formatAddress() correctly formats addresses', function(){
    deepEqual(actual, expected);
  });
};

function testGetGeocode(){
  var addresses = ['1407 Dean St, Brooklyn, NY', 'invalid address'],
    expected = [
      {
        lat: 40.676682,
        lng: -73.9420279
      },
      {
        lat: 'ERROR: improperly formatted address',
        lng: 'ERROR: improperly formatted address'
      }
    ],
    actual = _.map(addresses, function(address){
      return getGeocode(address);
    });
  test('getGeocode() returns correct geocode', function(){
    deepEqual(actual, expected);
  });
};

function testHandleDatabaseSubmit(){
  var stubIr_ = getStubIr_(),
    date = new Date(2014, 0, 1), //Jan 1, 2014
    targetSheets = getSheets('0AkfgEUsp5QrAdExWWU9udzEwcVVnVTRLRnJla3B1bWc'),
    expectedSheets = getSheets('0AkfgEUsp5QrAdFBLREg3UFY0d29ORXVVS3M0TkE5UGc');
  reset(targetSheets);

  handleDatabaseSubmit(stubIr_, date, targetSheets);
  _.each(targetSheets, function(sheet){
    sheet.refresh();
  });

  var actualRanges = getRanges(targetSheets), 
    expectedRanges = getRanges(expectedSheets);

  _.each(actualRanges, function(range, sheetName){
    test('handleDatabaseSubmit() correctly translates & writes for sheet: ' + sheetName, function(){
      deepEqual(actualRanges[sheetName], expectedRanges[sheetName]);
    });
  });
};

function getRanges(sheets){ //input: Array of Sheets
                            //output: Obj w/ key sheetName, val Sheet range
  ranges = {};
  _.each(sheets, function(sheet, sheetName){
    ranges[sheetName] = toRange(sheet.data, sheet.headers);
  });
  return ranges;
};

function getStubIr_(){
  return { 
    'Restaurant Name': 'some restaurant',
    'Restaurant Phone': '555-555-5555',
    'Contact Person Name': 'some manager',
    'Contact Person Phone': '444-444-4444',
    'Contact Person Email': 'bkshifttester@gmail.com',
    'Street Address': '60 wall st',
    'Borough': 'Manhattan',
    'Neighborhood': 'financial district',
    'Zone size': 'super fucking big',
    'Daytime volume': 'really fucking busy',
    'Nighttime volume': 'even fucking busier',
    'On-premises service': 'No',
    'Extra work': 'Yes',
    'Extra work description': "Riders are expected to wipe owner's ass upon request.",
    'Shifts needed': 'Monday AM, Monday PM',
    'AM shift hours': 'start to finish',
    'PM shift hours': 'start to finish and THEN SOME!',
    'Schedule comments': 'i say work, you say how long?!',
    'Rider Payment Method': 'Cash',
    'Rider Pay Rate': '$15/hr and a union',
    'Shift Meal': 'Discounted meal',
    'Tip Payment': 'No',
    'Equipment': 'Bike / scooter',
    'Agency Payment Method': 'Cash', 
    'Terms of business': 'Yes'
  };
};

function getSheets(key){
  return {
      info: new Sheet(key, 'info'),
      workConditions: new Sheet(key, 'workConditions'),
      scheduleNeeds: new Sheet(key, 'scheduleNeeds'),
      metrics: new Sheet(key, 'metrics'),
      balances: new Sheet(key, 'balances') 
    }
};

function reset(sheets){
  _.each(sheets, function(sheet){
    Logger.log('sheet class: ' + sheet.class);
    Logger.log('sheet instance: ' + sheet.instance);
    Logger.log('last row:' + sheet.g.getLastRow());
    Logger.log('last col: ' + sheet.g.getLastColumn());
    sheet.g.getRange(2, 1, sheet.g.getLastRow()-1, sheet.g.getLastColumn()).clear({contentsOnly:true});
  });
};
    