//*CONSTRUCT SHEET OBJECTS

function constructSheet(sheetName){
  var sheet = {},
    sheetMap = {
      Riders: {
        key: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
        sheets: ['info', 'assignments', 'metrics']
      },
      Restaurants: {
        key: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
        sheets: ['info', 'needs', 'metrics']
      },
      Shifts: {
        key: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
        sheets: ['shifts']
      },
      Schedule: {
        key: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
        sheets: ['grid', 'weekly', 'update', 'lookup', 'cellmap', 'rowmap']
      }
    }; 
  for (var i = 0; i < sheetMap[sheetName].sheets.length; i++){
      sheet[sheetMap[sheetName].sheets[i]] = new Sheet(sheetMap[sheetName].key, i);
  }
  return sheet;
};

function constructSheets(sheetNames){
  var sheets = {},
    sheetMap = {
      Riders: {
        key: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
        sheets: ['info', 'assignments', 'metrics']
      },
      Restaurants: {
        key: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
        sheets: ['info', 'needs', 'metrics']
      },
      Shifts: {
        key: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
        sheets: ['shifts']
      },
      Schedule: {
        key: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
        sheets: ['grid', 'weekly', 'update', 'lookup', 'cellmap', 'rowmap']
      }
    }; 
  for (var i = 0; i < sheetNames.length; i++){
    var sheetName = sheetNames[i];
    sheets[sheetName] = {};
    for (var j = 0; j < sheetMap[sheetName].sheets.length; j++){
        sheets[sheetName][sheetMap[sheetName].sheets[j]] = new Sheet(sheetMap[sheetName].key, j);
    }
  }
  return sheets;

};

//construct sheet objects
function Sheet(key, index) {

  //create store copy of google apps version of sheet object
  this.g = SpreadsheetApp.openById(key).getSheets()[index];
  
  //offset row/col picker for UI if the sheet in question is the schedule, otherwise set R,C of first cell to 2,1
  this.col = {
    first: 1,
    last: this.g.getLastColumn(),
    num: this.g.getLastColumn()
  };
  this.row = {
    first: 2,
    last: this.g.getLastRow(),
    num: this.g.getLastRow() - 2 + 1
  };

  //translate row data to JSON (see script below)
  this.data = getRowsData(this.g, this.g.getRange(this.row.first, this.col.first, this.row.last, this.col.last), 1);

  //create array of header names
  this.headers = normalizeHeaders(this.g.getRange(1, 1, 1, this.col.last).getValues()[0]);

   //*ACCESSOR METHODS

  this.getCell = function (row, col){
    return this.g.getRange(row, col).getValue();
  };

  this.updateCell = function(row, col, val){
    this.g.getRange(row, col).setValue(val);
    return this;
  };

  this.getRowNum = function(id){
    for (var i = 0; i < this.data.length; i++){
      if (this.data[i].id == id) {
        return (i + 2);
      }
    }
  };

  this.getRow = function(row){
    return this.g.getRange(row, this.col.first, 1, this.col.num);    
  }

  this.updateRow = function(srcSheet, srcRow, dstRow){
    var src = srcSheet.getRow(srcRow).getValues();
    this.getRow(dstRow).setValues(src);
    return this; // for method chaining
  };

  this.appendRow = function(srcSheet, srcRow){
    var src = srcSheet.getRow(srcRow).getValues();
    this.g.appendRow(src);
    return this;  //for method chaining
  };

  this.getColNum = function (headerName){
    return this.headers.indexOf(headerName) + 1;
  }

  this.clearRange = function (){
    this.g
      .getRange(this.row.first, this.col.first, this.row.num, this.col.num)
      .clear({contentsOnly:true});
  };

  this.setRange = function (range){
    this.g
      .getRange(this.row.first, this.col.first, range.length, range[0].length)
      .setValues(range);
  };

};

//*TRANSLATE SPREADSHEET DATA TO JSON

function getRowsData(sheet, range, columnHeadersRowIndex) {
  columnHeadersRowIndex = columnHeadersRowIndex || range.getRowIndex() - 1;
  var numColumns = range.getLastColumn() - range.getColumn() + 1;
  var headersRange = sheet.getRange(columnHeadersRowIndex, range.getColumn(), 1, numColumns);
  var headers = headersRange.getValues()[0];
  return getObjects(range.getValues(), normalizeHeaders(headers));
}

function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

function normalizeHeaders(headers) {
  var keys = [];
  for (var i = 0; i < headers.length; ++i) {
    var key = normalizeHeader(headers[i]);
    if (key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}

function normalizeHeader(header) {
  var key = "";
  var upperCase = false;
  for (var i = 0; i < header.length; ++i) {
    var letter = header[i];
    if (letter == " " && key.length > 0) {
      upperCase = true;
      continue;
    }
    if (!isAlnum(letter)) {
      continue;
    }
    if (key.length == 0 && isDigit(letter)) {
      continue; // first character must be a letter
    }
    if (upperCase) {
      upperCase = false;
      key += letter.toUpperCase();
    } else {
      key += letter.toLowerCase();
    }
  }
  return key;
}

function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}

// Given a JavaScript 2d Array, this function returns the transposed table.

function arrayTranspose(data) {
  if (data.length == 0 || data[0].length == 0) {
    return null;
  }

  var ret = [];
  for (var i = 0; i < data[0].length; ++i) {
    ret.push([]);
  }

  for (var i = 0; i < data.length; ++i) {
    for (var j = 0; j < data[i].length; ++j) {
      ret[j][i] = data[i][j];
    }
  }

  return ret;
}

//*UTILITY FUNCTIONS*

//add dedupe method to Array prototype
Array.prototype.dedupe = function() {
    var i, 
      obj ={}, 
      out=[];
    for (i = 0; i < this.length; i++){
      obj[this[i]] = typeof this[i];
    }
    for (i in obj){
      out.push(i);
    }
    for (i=0; i < out.length; i++){
      this[i] = out[i];
    }
    this.splice(out.length, this.length - out.length);
    return this;
};

//add increment date function to Date object prototype
Date.prototype.incrementDate = function(numDays){
  return new Date(this.getTime() + numDays*(24 * 60 * 60 * 1000));
  //return this;
};

//add get week start function to Date prototype (will return date object for the Monday of the week any given date is in)
Date.prototype.getWeekStart = function(){
  var day = this.getDay(),
    diff = this.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  return new Date(this.setDate(diff));
};

Date.prototype.getWeekMap = function(){
  var weekStart = this.getWeekStart();
  return {
    mon: weekStart,
    tue: weekStart.incrementDate(1),
    wed: weekStart.incrementDate(2),
    thu: weekStart.incrementDate(3),
    fri: weekStart.incrementDate(4),
    sat: weekStart.incrementDate(5),
    sun: weekStart.incrementDate(6)
  }
};


function toast(string){
  SpreadsheetApp.getActiveSpreadsheet().toast(string);
};


//*CREATE MENU BUTTONS

function createMenus() {
    var menuEntries = [
      {        
        name: "Update View",
          functionName: "initUpdateViewUi" 
      },{
          name: "Save Edits",
          functionName: "updateShifts" 
      }
    ];
    SpreadsheetApp.getActiveSpreadsheet().addMenu("Functions", menuEntries);
};

//*DISPLAY SHIFTS

//initiate UI dialog
function initUpdateViewUi(){

  //get sheet and sheet index to determine view to pass to click handler
  var sheetName = SpreadsheetApp.getActiveSheet().getName(),
    sheet = constructSheet('Schedule')[sheetName],
  //retrieve view's current start and end dates from sheet data
    curStart = sheetName == 'grid' ? new Date() : sheet.data[0].start.getWeekStart(),
    curEnd = sheetName == 'grid' ? new Date() : curStart.incrementDate(6);

  /*   
  //store date of first shift's start time as default 'start' and 'end' of view
  var data = sheet.data,
    curStart = data[0].start,
    curEnd = data[0].start;
  //loop through view
  for (var i = 0; i < data.length; i++){
    if (data[i].start < curStart){
      curStart = data[i].start;
    }
    if (data[i].start > curEnd) {
      curEnd = data[i].start;
    }
  }
  */
    
  //construct ui app
  var app = UiApp.createApplication().setTitle('Update Schedule View').setWidth(200),
    //construct panel to hold user input elements
    panel = app.createVerticalPanel(),
    //construct ui elements to retrive and store paramaters to pass to updateShiftsView()
    view = app.createHidden('view', sheetName).setName('view').setId('view'),//store sheet name as 'view'
    startLabel = app.createLabel('Start Date').setId('startLabel'),
    start = app.createDateBox().setName('start').setId('start').setValue(curStart),
    endLabel = app.createLabel('End Date').setId('endLabel'),
    end = app.createDateBox().setName('end').setId('end').setValue(curEnd),
    //define callback
    submitHandler = app.createServerHandler('updateView')
      .setId('submitHandler')
      .addCallbackElement(view)
      .addCallbackElement(start)
      .addCallbackElement(end);
  //for lookup view, retrieve restaurants and riders from user input 
  if (sheetName == 'lookup'){
    var restaurantsLabel = app.createLabel('Restaurants').setId('restaurantsLabel'),    
      restaurants = app.createTextBox().setName('restaurants').setId('restaurants').setValue('all'),
      ridersLabel = app.createLabel('Riders').setId('ridersLabel'), 
      riders = app.createTextBox().setName('riders').setId('riders').setValue('all'); 

  } else { //for all other views, store 'all' restaurants as hidden paramater 
    var restaurants = app.createHidden('restaurants', 'all').setName('restaurants').setId('restaurants'),
      riders = app.createHidden('riders', 'all').setName('riders').setId('riders');
  }
  submitHandler
    .addCallbackElement(restaurants)
    .addCallbackElement(riders);

  //define button to trigger callback
  var submit = app.createButton('Submit!')
      .addClickHandler(submitHandler);
  //add app elements to each other (funky order here?)
  panel
    .add(startLabel)
    .add(start)
    .add(endLabel)
    .add(end);
  if (sheetName == 'lookup'){
    panel
      .add(restaurantsLabel)  
      .add(restaurants)  
      .add(ridersLabel) 
      .add(riders);
  } 
  panel.add(submit);
  
  app
    .add(panel);

  //  sheet.g.getParent().show(app);
  SpreadsheetApp.getActiveSpreadsheet().show(app);
};

//520pm

function getIdsFromNames(model, names){
  var ids = [];
  for (var i = 0; i < names.length; i++){
    ids.push(getIdFromName(model, names[i]));
  }
  return ids; 
};

function getIdFromName(model, name){
  for (var i = 0; i < model.data.length; i++){
    if (model.data[i].name == name){
      return model.data[i].id;
    }
  }
};

function getRecordsByIds(model, ids){
  for (var i = 0; i < ids.length; i++){
    records.push(getRecordById(model, id));
  }
  return records;
};

function getNamesFromIds(model, ids){
  var names = [];
  for (var i=0; i < ids.length; i++){
    names.push(model.data[ids[i]].name);
  }
  Logger.log('names: ' + names);
  return names;
};


function getRefIdsFromRecords(records, refName){
  var refIds = [];
  for (var i = 0; i < records.length; i++){
    refIds.push(getRefIdFromRecord(records[i], refName));
  }
  return refIds;
};

function getRefIdFromRecord(record, refName){
  return record[refName + 'id'];
}


function setFilters(params, view){
  filters = ['date'];
  if (view == 'update'){
    filters.push('update')
  } else if (view == 'lookup'){
    if (params.riders != 'all' & params.restaurants != 'all'){
      filters.push('lookupDefault');
    } else if (params.riders == 'all'){
      filters.push('lookupAllRiders');
    } else {
      filters.push('lookupAllRestaurants')
    }
  } else {
    filters.push('default');
  }
  return filters;
}

function getRecordsByParams(model, refIds, params, filters){

/* where refIds are of the form:
refIds = {
  riders: [id, id, id],
  restaurants: [id, id, id]
}

refIds = [
  {rider: , rest: }
]

params = {
  
}

*/
  var records = [];
  for (var i in refIds){
    for (var j = 0; j < model.data.length; j++){
      if (applyFilter(model.data[j], refIds, filters)){
        continue;
      } else {
        getRecordById(refIds[i][j].id);
      }
    }

  }
  return records;
};

function getRecordById(model, id){
  return model.data[id];
};

/*
function applyFilters(record, refIds, params, filters){
  var filterMap = {
    default: ((refIds[rest].indexOf(record.restaurantid) < 0) && (refIds[rider].indexOf(record.restaurantid) < 0)),//filters out shifts w/o rider or rest
    date: (record.start < params.start && record.start.getDate() < params.start.getDate()) || (record.start > record.end && record.start.getDate() > record.end.getDate()),
    update: record.status == 'confirmed' || record.status == 'cancelled',
    lookupAllRiders: refIds[rest].indexOf(record.restaurantid) < 0,
    loookupAllRestaurants: refIds[rider].indexOf(record.restaurantid) < 0
  };
  for (var i = 0; i < filters.length; i+){
    for (var j in filterMap){
      if (filterMap[filters[i]]){
        return true;
      }
    }
  }
};
*/






///// vvv UPDATE VIEW MAIN FUNCTION vvv //////

function updateView(e){
  Logger.log('e: ' + e);
  Logger.log('e.parameter: ' + e.parameter);
  Logger.log('start: ' + e.parameter.start);
  Logger.log('end: ' + e.parameter.end);
  Logger.log('restaurants: ' + e.parameter.restaurants);
  Logger.log('riders: ' + e.parameter.riders);
  Logger.log('view: ' + e.parameter.view);

  //store reference to active uiApp instance
  var app = UiApp.getActiveApplication(),  
    //consruct sheets
    restaurants = constructSheet('Restaurants').info.data,
    riders = constructSheet('Riders').info.data,
    //retrieve ids for restaurants and riders given in params
    restaurantIds = getIds(restaurants, e.parameter.restaurants.split(', ')),
    riderIds = getIds(riders, e.parameter.riders.split(', ')),
    //note if all restaurants or riders have been specified in params
    allRests = e.parameter.restaurants === 'all' ? true : false,
    allRiders = e.parameter.riders === 'all' ? true : false;
  //if restaurant and rider ids are found, retrieve corresponding shifts and populate view with them
  if (restaurantIds.length > 0 && riderIds.length > 0) {
    shifts = getShifts(e.parameter.start, e.parameter.end, restaurantIds, riderIds, allRests, allRiders, e.parameter.view);
    if (shifts.length > 0){
      var weekMap = shifts[0].start.getWeekMap();
      for (var i in weekMap){
        Logger.log('weekmap['+i +']: ' + weekMap[i]);
      }
      e.parameter.view == 'grid' ? setShiftGrid(shifts, weekMap) : setShiftList(shifts, e.parameter.view);      
    }
    //if not, terminate execution and throw the appropriate error message
  } else {
    if (restaurantIds.length <= 0){
      SpreadsheetApp.getActiveSpreadsheet().toast('EROR: No restaurants matching the specified names were retrieved.');
    }
    if (riderIds.length <= 0){
      SpreadsheetApp.getActiveSpreadsheet().toast('EROR: No riders matching the specified names were retrieved.');
    }
  }
  //close uiApp instance
  return app.close();
};


////// ^^^ UPDATE VIEW MAIN FUNCTION ^^^ //////

////// vvv UPDATE VIEW HELPER FUNCTIONS vvv ///////

//reverse lookup restaurant id's by restaurant name, store both in array
function getIds(data, names){
  var ids = [];
  //if entity params specify 'all', retrive ids for every active entity
  if (names == 'all'){
    for (var i = 0; i < data.length; i++){
      ids.push(data[i].id);
    }
  } else {
    
    var anyIdFound = false;
    //reverse lookup each entity id by its name
    //loop through param names
    for (var i = 0; i < names.length; i++){
      //initialize error control flow vars
      var idFound = false,
        entityActive = false;
      //compare param names to entity names in model
      for (var j = 0; j < data.length; j++){
        //if match found and entity is active, add the entity's to ids[]
        if (data[j].name == names[i]) {
          idFound = true;
          ids.push(data[j].id);
          if (data[j].active){
            entityActive = true;
          } 
          break;                          
        }
      }
      anyIdFound = idFound;
      //if there is no entity with the name given in params, throw an error message
      if (!idFound) {
        SpreadsheetApp.getActiveSpreadsheet().toast('ERROR: There is no entity with the name "' + names[i] + '"');
        //break;
      }
      //if the restaurant given in params is inactive throw an error message
      if (!entityActive) {
        SpreadsheetApp.getActiveSpreadsheet().toast('WARNING: The entity "' + names[i] + '" is inactive.');
        //break;
      }
    }
  }
  return ids;
};


function getShifts(start, end, restaurantIds, riderIds, allRests, allRiders, view){
  var data = constructSheet('Shifts').shifts.data,
    shifts = [];
  for (var i = 0; i < data.length; i++){
    //filter out shifts with dates outside the start/end span given in params
    if (
        (data[i].start < start && data[i].start.getDate() < start.getDate()) || 
        (data[i].start > end && data[i].start.getDate() > end.getDate())
    ) {
      continue;
    }
    //if user is in update view, filter out any confirmed or cancelled shifts      
    if (view =='update'){
      if (data[i].status == 'confirmed' || data[i].status == 'cancelled') {
        continue;
      }
    }
    //if user is in lookup view, use an exclusive search for matching shifts (riders *and* restaurants)
    if (view == 'lookup'){
      // if all riders are specified in params, retrieve shifts with restaurants matching those in params
      if (allRiders){
        if (restaurantIds.indexOf(data[i].restaurantid) >=0){
          shifts.push(data[i]);//add retrieved shifts to shifts[]
        }
      //if all restaurants are specified in params, retrieve shifts with riders matching those in params        
      } else if (allRests){
        if (riderIds.indexOf(data[i].riderid) >= 0){
          shifts.push(data[i]);
        }
      //if specific restaurants *and* riders are specified, use an *exclusive* search to retrieve shifts matching restaurants *and* riders
      } else {
        if (restaurantIds.indexOf(data[i].restaurantid) >= 0 && riderIds.indexOf(data[i].riderid) >= 0){
          shifts.push(data[i]);
        }
      }
    //in all views other than lookup, use an *inclusive* search to retrieve shifts matching restaurants *or* riders in params  
    } else {
      if (restaurantIds.indexOf(data[i].restaurantid) >= 0 || riderIds.indexOf(data[i].riderid) >= 0){
        shifts.push(data[i]);
      }
    }
  }
  if (view == 'update' && shifts.length == 0){
    toast('There are no hanging shifts!');
  } else {
    return shifts;
  }
};



function setShiftList(shifts, view){
  var schedule = constructSheet('Schedule')[view], 
    range = [];
  for (var i = 0; i < shifts.length; i++){
    range[i] = [
      shifts[i].id,
      shifts[i].start,
      shifts[i].end,
      shifts[i].am,
      shifts[i].pm,
      shifts[i].restaurantid,
      shifts[i].restaurantname,
      shifts[i].riderid,
      shifts[i].ridernick,
      shifts[i].status,
      shifts[i].urgency,
      shifts[i].billing,
      shifts[i].calendarid
    ];
  }  
  schedule.clearRange();
  schedule.setRange(range);
};

////// vvv SET GRID MAIN FUNCTION vvv //////

function setShiftGrid(shifts, weekMap){
  var cellMap = constructSheet('Schedule').cellmap.data,
    grid = constructSheet('Schedule').grid,
    restaurants = constructSheet('Restaurants').info,
    restaurantNames = getNamesFromIds(restaurants, getRefIdsFromRecords(shifts.data, 'restaurant').dedupe()).sort(),
    gridMap = getGridMap(shifts, weekMap, restaurantNames),
    range = getGridRange(shifts, gridMap);
  
  grid.clearRange();
  grid.setRange(range);
  //highlightShifts(range);
  setCellMap(gridMap, restaurantNames);
};

////// ^^^ SET GRID MAIN FUNCTION ^^^ //////

////// vvv SET GRID HELPER FUNCTIONS vvv //////


function getGridMap(shifts, weekMap, restaurantNames){
  var gridMap = {};
  for (var i = 0; i < restaurantNames.length; i++){
    gridMap[restaurantNames[i]] = {
      mon: {
        am: {shiftIds: [], col: 2}, 
        pm: {shiftIds: [], col: 3}
      },
      tue: {
        am: {shiftIds: [], col: 4}, 
        pm: {shiftIds: [], col: 5}
      },
      wed: {
        am: {shiftIds: [], col: 6}, 
        pm: {shiftIds: [], col: 7}
      },
      thu: {
        am: {shiftIds: [], col: 8}, 
        pm: {shiftIds: [], col: 9}
      },
      fri: {
        am: {shiftIds: [], col: 10}, 
        pm: {shiftIds: [], col: 11}
      },
      sat: {
        am: {shiftIds: [], col: 12}, 
        pm: {shiftIds: [], col: 13}
      },
      sun: {
        am: {shiftIds: [], col: 14}, 
        pm: {shiftIds: [], col: 15}
      }       
    }; 
  }
  setGridShiftIds(shifts, weekMap, gridMap);
  return gridMap;
};



function setGridShiftIds(shifts, weekMap, gridMap){
  for (var rest in gridMap){
    for (var day in gridMap[rest]){
      for (var period in gridMap[rest][day]){
        gridMap[rest][day][period].shiftIds = getGridShiftIds(shifts, weekMap, rest, day, period);
      }
    }
  }
};

//vvv translate to 

function getGridShiftIds(shifts, weekMap, rest, day, period){
  var am = (period == 'am') ? true : false,
    pm = !am,
    date = weekMap[day],
    gsIds= [];

  for (var i = 0; i < shifts.length; i++){
    var shift = shifts[i];
    if (
      shift.restaurantname == rest &&
      shift.am == am && 
      shift.pm == pm && 
      shift.start.getYear() == date.getYear() &&
      shift.start.getMonth() == date.getMonth() &&
      shift.start.getDate() == date.getDate()
    ) {
      gsIds.push(shift.id);
    }
  }
  return gsIds;
};


function getGridRange(shifts, gridMap){
  Logger.log('running getGridRange()');
  var range = [];
  for (var rest in gridMap){
    range.push(getGridRow(shifts, gridMap[rest], rest));
  }
  return range;
};

function getGridRow(shifts, gridRow, rowName){
  Logger.log('running getGridRow()');
  var row = [];
  row[0] = rowName
  for (var day in gridRow){
    for (var period in gridRow[day]){
      row.push(getGridCellFromShiftIds(shifts, gridRow[day][period].shiftIds));
    }
  }
  return row;
};


function getGridCellFromShiftIds(shifts, shiftIds){
  var cell = [];
  for (var i = 0; i < shiftIds.length; i++){
    var shift = shifts[shiftIds[i]],
      rider = shift.ridernick == undefined ? '' : shift.ridernick,
      status = getCodeFromStatus(shift.status);
    cell.push(rider + ' ' + status);
  }
  cell = cell.join(', ');
  return cell;
};


function getCodeFromStatus(status){
  var codes = {
    unassigned: '-u',
    assigned: '-a',
    delegated: '-d',
    confirmed: '-c',
    cancelled: '-x'
  }
  return codes[status];
};

function getStatusFromCode(code){
  var statuses = {
    '-u': 'unassigned',
    '-a': 'assigned', 
    '-d': 'delegated',
    '-c': 'confirmed',
    '-x': 'cancelled'
  }
  return statuses[code];
}

function setCellMap(gridMap, restaurantNames){
  var cellmap = constructSheet('Schedule').cellmap,
    range = [];
  //build cellmap range from gridRow data
  for (var rest in gridMap){
    for (var day in gridMap[rest]){
      for (var period in gridMap[rest][day]){
        for (var j = 0; j < gridMap[rest][day][period].shiftIds.length; j++){
          range.push([
            restaurantNames.indexOf(rest) + 2,//row
            gridMap[rest][day][period].col,//col
            j,//index 
            gridMap[rest][day][period].shiftIds[j]//shiftId
          ]);
        }
      }
    }
  }

  //prepend cellMap id to first cell of each row in range
  for (var i = 0; i < range.length; i++){
    range[i].unshift(i);
  }
  //clear cellmap worksheet target range
  cellmap.clearRange();
  //write range to cellmap worksheet
  cellmap.setRange(range);
};

function highlightShifts(){
  //check if 
};
////// ^^^ SET GRID HELPER FUNCTIONS ^^^ //////
////// ^^^ UPDATE VIEW HELPER FUNCTIONS ^^^ ///////

////// vvv UPDATE SHIFTS MAIN FUNCTION vvv ///////
function updateShifts(){
  var shifts = constructSheet('Shifts').shifts,
    riders = constructSheet('Riders').info,
    view = SpreadsheetApp.getActiveSheet().getName(),
    schedule = constructSheet('Schedule')[view];
  shiftList = view == 'grid' ? getShiftListFromGrid(shifts, riders, schedule) : schedule.data;   
  
  setShifts(shifts, shiftList);

  //CALLBACKS
  toast('Shifts model successfully updated!');
  //updateAssignments();
  updateCalendars(shifts, shiftList);//pass schedule view as an argument to avoid having to call .getActiveSheet() again
};
////// ^^^ UPDATE SHIFTS MAIN FUNCTION ^^^ ///////

////// vvv UPDATE SHIFTS HELPER FUNCTIONS vvv ///////

function getShiftListFromGrid(shifts, riders, schedule){
  Logger.log('running getShiftListFromGrid');
  var cellmap = constructSheet('Schedule').cellmap,
    shiftListRow = {},
    shiftList = [];
  for (var i = 0; i < cellmap.data.length; i++){
    var shift = shifts.data[cellmap.data[i].shiftid];
    for (var j in shift){
      shiftListRow[j] = shift[j];
    }
    shiftList.push(shiftListRow);
  }
  return shiftList;
};

function setShifts(shifts, shiftList){
  //copy shift data from rows in view that match rows in model by id 
  for (var i = 0; i < shiftList.length; i++){
    var id = shiftList[i].id;
    //if no shift exists in model w/ id matching shiftList, create and append a new row to the model w/ data from the sked
    if (shifts.data.length < id + 1){
      shifts.appendRow(shiftList, i + 2);
    } else {
      //overwrite all cell data in model shifts matched to view shifts by id whose old values differ from new values
      for (var k in shiftList[i]){
        if (shiftList[i][k] != shifts.data[id][k]){
          shifts.updateCell(shifts.getRowNum(id), shifts.getColNum(k), shiftList[i][k]);
        }
      }
    }
  } 
};


////// ^^^ UPDATE SHIFTS HELPER FUNCTIONS ^^^ ///////


////// vvv UPDATE CALENDAR MAIN FUNCTION vvv //////
function updateCalendars(shifts, shiftList){
  var sheets = constructSheets(['Restaurants', 'Shifts']);
    restaurants = sheets.Restaurants.info,
    restIds = getRefIdsFromRecords(shiftList, 'restaurant').dedupe(),
    calendars = getCals(shiftList, restIds);
    //events = getEvents(shiftList);
    /*
    //check to see if calendars exist for all restaurants being updated
    if (!calExists(restaurants, schedule[i].restaurantid)){
      //if any calendars don't exist, throw an error message warning the user to create one and proceed
      SpreadsheetApp.getActiveSpreadsheet.toast('ERROR: There is no calendar for ' + schedule[i].restaurantname + '. Please go to the restaurants model and create one.')
    }
    */
  
  //loop through all shifts in view
  for (var i = 0; i < shiftList.length; i++){
    var rider = shiftList[i].ridernick,
      status = shiftList[i].status,
      restId = shiftList[i].restaurantid,
      eventId = shiftList[i].eventid,
      shift = shiftList[i];
      Logger.log('restId: ' + restId);
      Logger.log('eventId:' + eventId);
    //check to see if calendar events exist for all shifts
   (eventId !== '' && eventId !== 'undefined' && eventId !== undefined) ?
      //if a event exists, update it
      getEventById(calendars, restId, eventId).setTitle(getStatusCode(rider, status)) :
      //if not, create one
      createEvent(calendars[shift.restaurantid].cal, shifts, shift, getStatusCode(rider, status));    
  }
  toast('Calendar successfully updated!');



  ////// ^^^ UPDATE CALENDAR MAIN FUNCTION ^^^ //////

  //**CLOSURES


  function getCals(shiftList, restIds){
    for (var i = 0; i < shiftList.length; i++){
      for (var j in shiftList[i]){
        Logger.log('shiftList['+i+']['+j+']' + shiftList[i][j]);
      }
    }
    var cals = {};
    for (var i = 0; i < restIds.length; i++){
      var calObj = CalendarApp.getCalendarById(restaurants.data[restIds[i]].calendarid);
      cals[restIds[i]] = {
        cal: calObj,
        events: getEventsFromCalendar(shiftList, calObj, restIds[i]) 
      };
    }
    for (var i in cals){
      for (var j in cals[i].events){
          Logger.log('cals['+i+'].events['+j+'] ' + cals[i].events[j]);
      }
    }
    return cals;
  };


  function getEventsFromCalendar(shiftList, calendar, restId){
    Logger.log('running getEvents() for restId: ' + restId);
    var events = {};
    //construct events obeject w/ event id as key and event object as value
    for (var i = 0; i < shiftList.length; i++){
      var eventId = shiftList[i].eventid;
      if (
            //skip rows with shifts for restaurants other than the one for which events are being retrieved
            (restId != shiftList[i].restaurantid)||
            //skip rows without pre-existing events
            (eventId === ''|| eventId === 'undefined' || eventId === undefined)
          ){
        continue;
        //for rows matching the restaurant and containing event ids, retrieve calendar events corresponding to the restaurant and the shifts's time
      } else {
        Logger.log('Match found! eventId: ' + eventId);
        //store temp array of all events matching the shift's start and end time
        var tempEvents = calendar.getEvents(shiftList[i].start, shiftList[i].end);
        Logger.log('tempEvents.length:' + tempEvents.length);
        for (var j = 0; j < tempEvents.length; j++){
          //add each event to the events object with the event id as key and the event object as value
          events[tempEvents[j].getId()] = tempEvents[j]  
        }        
      }
    }
    Logger.log('events.length: ' + events.length);
    return events;
  };

  function getEventById(calendars, restId, eventId){
    Logger.log('running getEventById for calendars: ' + calendars + ', restId: ' + restId + ', eventId: ' + eventId);
    Logger.log('calExists('+restId+'): ' +calExists(restId));
    Logger.log('calendars['+restId+'].events['+eventId+']: ' + calendars[restId].events[eventId])
    return calendars[restId].events[eventId];
  };

  function createEvent(calendar, shifts, shift, statusCode){
    var event = calendar.createEvent(statusCode, shift.start, shift.end); 
    appendEventId(shifts, shift.id, event.getId());
  }

  function appendEventId(shifts, shiftId, eventId){
    //if in schedule view, update eventid column?
    shifts.updateCell(shifts.getRowNum(shiftId), shifts.getColNum('eventid'), eventId);
  };

  function getStatusCode(rider, status){
    var statusCodes = {
      unassigned: '*unassigned',
      assigned: '*' + rider + '? (a)',
      delegated: '*' + rider + '? (d)',
      confirmed: rider + ' (c)',
      cancelled: 'CANCELLED'
    };
    return statusCodes[status];
  };
};

  function calExists(restaurantId){
    if(CalendarApp.getCalendarById(restaurants.data[restaurantId].calendarid) !== undefined){
      return true;
    } else {
      return false;
    }
  };



function updateAssignments(sheets){
  //construct sheets
  var sheets = constructSheets(['Schedule', 'Riders']),
    sked = sheets.Schedule.weekly,
    assigns = sheets.Riders.assignments, 
    period = [];
  //match scheduled shifts to rider assignment blocks by date/period, then update rider assignment blocks with data from schedule
  for (var i = 0; i < sked.length; i++){
    for (var j = 0; j < assigns.length; i++){
      if (
        sked.data[i].start.getFullYear() == assigns.data[j].date.getFullYear() &&
        sked.data[i].start.getMonth() == assigns.data[j].date.getMonth() &&
        sked.data[i].start.getDate() == assigns.data[j].date.getDate() 
      ){
        //store period of shift in array
        if (sked.data[i].am && ! sked.data[i].pm){
          period = ['am'];
        } else if (!sked.data[i].am && sked.data[i].pm) {
          period = ['pm'];
        } else if (sked.data[i].am && sked.data[i].pm){
        //update shifts that span am & pm periods
          period = ['am', 'pm'];
        } else {
          //throw error message if shift has no period
          getActiveSpreadsheet.toast('ERROR: you just tried to update a shift (id = ' + sked[i].id + ') with no AM/PM designation.');
          Logger.log('ERROR: you just tried to update a shift (id = ' + sked[i].id + ') with no AM/PM designation.');
        }
        if (assigns.data[j].period == period[0] || assigns.data[j].period == period[1]){
          //populate one row
          assigns.data[j].status = sked.data[i].status;
          assigns.data[j].shiftId = sked.data[i].id;
        } 
        //write new assignment values to Rider.assignments model
        assigns
          .updateCell(j + 2, assigns.getCol('status'), assigns.data[j].status)
          .updateCell(j + 2, assigns.getCol('shiftId'), assigns.data[j].shiftId);
      }
    }
  }
};


function initGetFreeRidersUi(){

};

function getFreeRiders(){

};

function getShiftsFromNeeds(){

};






function matchShiftsToAvail(){
  //identify restaurant needs that match restaurant names and dates specified in the paramaters
  for (var i = 0; i < restaurants.length; i++) {
    for (var j = 0; j < RestaurantNeeds.data.length; j++) {
      if (
          RestaurantNeeds.data[j].restaurantId == restaurants[i].id && 
          RestaurantNeeds.data[j].start >= start && 
          RestaurantNeeds.data[j].end <= end
        ) {
          shiftsToTest.push(RestaurantNeeds[j]);
      }
    }
  }

  //test if restaurant needs exist as shifts
  for (var i = 0; i < shiftsToTest.length; i++){
    for (var j = 0; j < Shifts.data.length; j++){
      //add shifts that exist to an existing "shifts that exist" array, shifts that don't to "shifts that don't exist" array
      Shifts.data[j].restaurantNeedId == shiftsToTest[i].id ? 
        shiftsThatExist.push(Shifts[j]) : 
        shiftsThatDontExist.push(Shifts[j]);
    }
  }

  createShifts(shiftsThatDontExist);

  shiftsThatExist.push(shiftsThatDontExist);
  return shiftsThatExist  // YEAH!
  
  //create shifts for all elements in the "shifts that don't exist" array
  function createShifts(shifts){
    //DO STUFF!
  } 

}
