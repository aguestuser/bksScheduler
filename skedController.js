/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

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
        sheets: ['grid', 'weekly', 'update', 'lookup']
      },
      ScheduleCellMaps: {
        key: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
        sheets: ['grid', 'weekly', 'update', 'lookup']
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

Date.prototype.getDayName = function(){
  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames[this.getDay()];
};


Date.prototype.getFormattedTime = function(){
  var hr = this.getHours(), //> 12 ? this.getHours() - 12 : this.getHours(),
    min = this.getMinutes(), //('0' + this.getMinutes()).slice(-2),
    str = hr + ':' + min ;
  return str;
};

Date.prototype.getFormattedDate = function(){
  var month = this.getMonth() + 1,
    date = this.getDate(),
    str = month + '/' + date;
  return str;
}

function toast(string){
  SpreadsheetApp.getActiveSpreadsheet().toast(string);
};

function getDayNum(dayName){
  var dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames.indexOf(dayName);
};

/////////


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


function getRecordById(model, id){
  return model.data[id];
};

function getNamesFromIds(model, ids){
  var names = [];
  for (var i=0; i < ids.length; i++){
    names.push(getNameFromId(model, ids[i]));
  }
  Logger.log('names: ' + names);
  return names;
};

function getNameFromId(model, id){
  return model.data[id].name;
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
};

////////




/*
//SET VIEW

 var view = SpreadsheetApp.getActiveSheet.getName(),
  sheet = 'Schedule.' + view,
  model = 'Shifts.shifts',
  refs = {restaurants: 'Restaurants.info', riders: 'Riders.info'},
  params = e.parameter,
  filters = {};

schedule = new View(sheet, view, model, refs);
schedule
  .setRefIdsFromParams(params, filters)
  .setRecordListFromRefIds()
  .setDisplayFromRecordList()
  .updateViewFromDisplay();

//UPDATE MODEL

var view = SpreadsheetApp.getActiveSheet.getName(),
  sheet = 'Schedule.' + view,
  model = 'Shifts.shifts',
  refs = 

schedule = new View(sheet, view, model, refs);
schedule
  .setDisplayFromSheet()
  .setRecordListFromDisplay()
  .updateModelFromRecordList();

// UPDATE AVAILABILITY

var viewName = 'weekly', 
  sheet = 'Availability.weekly',
  model = 'Avails.avails',
  refs = {riders: 'Riders.info'},
  refView = schedule;

avail = new View (viewName, sheet, model, refs);

avail
  .setRefIdsFromView(schedule, ['riders'])
  .setRecordListFromRefIds()
  .updateModelFromRecordList();


//VIEW CONSTRUCTOR FUNCTION

function View(viewName, sheet, model, refs){
  this.viewName = viewName; 
  this.viewType = viewName.indexOf('grid') >= 0 ? 'grid' : 'list';
  this.sheet constructSheet(sheet[view]);
  this.model = constructSheet(model);
  for (var model in refs){
    this.refs[model] = {
        sheet: constructSheet(refs[model]);
        refIds: []
  }
  this.recordList = {}; //object that is a virtual map of all records displayed in view
  this.display = []; //range that is a virtual map of sheet cells

  //FOR UPDATING VIEW

  this.setRefIdsFromParams = function(params){
    for (var model in this.refs){
      this.refs[model]['refIds'] = getRefIdsFromParams(params, filters);
    }
  };

  //use for updating availability to slurp rider ids from schedule view
  this.setRefIdsFromView = function(view, modelNames){
    for (var i = 0; i < modelNames.length; i++){
      var model = modelNames[i];
      this.refs[model]['refIds'] = view.refs[model].refIds;      
    }
  };

  //use after getting refIds with either of two above methods
  this.setRecordListFromRefIds = function(filters){

  };

  this.setDisplayFromRecordList = function (){
    if (this.viewType == grid) {
      //
    } else {

    }
  };

  //assumes record list has already been set
  this.updateSheetFromDisplay = function (){

  };

  //FOR UPDATING MODEL

  this.setDisplayFromSheet = function (){

  };

  //use as first step of updating model from view
  this.setRecordListFromDisplay = function (){
    if (this.viewType == grid) {
      //
    } else {
      //
    }
  };



  //assumes recordList has already been set
  this.updateModelFromRecordList = function (){

  };


};

*/

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
    curStart = new Date().getWeekStart(),
    curEnd = curStart.incrementDate(6);
    
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
    //construct sheets
    shifts = constructSheet('Shifts').shifts,
    restaurants = constructSheet('Restaurants').info,
    riders = constructSheet('Riders').info,
    //store parameters
    params = e.parameter,
    view = e.parameter.view,
    //store reference models
    srcModel = 'shifts',
    refs = {restaurants: restaurants, riders: riders},
    refIds = getRefIdsFromParams(params, refs),
    //store filters
    filters = getFiltersFromParams(params, refIds, srcModel);
  
  //if there were no errors retrieving reference ids, use them to retrieve a list of shifts
  if (refIds.errors != undefined) {
    for (var i = 0; i < refIds.errors.length; i++){
      toast(refIds.errors[i]);
    }
  } else {
    var shiftList = getRecordListFromRefIds(shifts, refIds, filters, srcModel);
    //if there were no errors retrieving a list of records, use them to populate the schedule view
    if (shiftList.error != undefined){
      toast(shiftList.error);
    } else {
      var weekMap = shiftList[0].start.getWeekMap();
      if (params.view == 'grid'){
        setGridView(restaurants, riders, shiftList, weekMap);
      } else {
        setScheduleView(restaurants, riders, shiftList, params.view);      
      }
      //once view is successfully set, close uiApp instance
      return app.close();
    }
  }
};

////// ^^^ UPDATE VIEW MAIN FUNCTION ^^^ //////



function getRefIdsFromParams(params, refs){
  var refIds = {};
  //loop through params, find keys matching keys in refs
  for (var key in params){
    Logger.log('params['+key+']: ' + params[key]);
    //if match found, add ids for ref types to refids
    if (key in refs){
      refIds[key] = [];
      //if params specify all entities, loop through entity model and add ids of all entities to an array of ref ids for that entity
      if (params[key] == 'all'){
        for (var i = 0; i < refs[key].data.length; i++){
          refIds[key].push(refs[key].data[i].id);
        }
      } else { //otherwise, parse entity names from params and retrieve ids for each name
        var names = params[key].split(', ');
        for (var k = 0; k < names.length; k++){
          Logger.log('names['+k+']: ' + names[k]);
        }
        for (var i = 0; i < names.length; i++){
          var name = names[i],
            id = getIdFromName(refs[key], name);
          Logger.log('id: ' + id);
          if (id == undefined){
            refIds['errors'] = [];
            refIds.errors.push('ERROR: there are no '+ key + ' in the database with the name ' + name);
          } else {
            refIds[key].push(id);
          }
        }
      }
    }
  }

  for (var j in refIds){
    Logger.log('refIds for key: ' + j + ': ');
    for (var i = 0; i < refIds[j].length; i++){
      Logger.log(refIds[j][i]);
    }
  }
  return refIds;
};

function getFiltersFromParams(params, refIds, srcModel, view){//only works for shifts model, will need to be adapted for avail (and other) models
  var date = function(record, params){
      return (record.start < params.start && record.start.getDate() < params.start.getDate());
    };
  if (srcModel == 'shifts'){
    var view = params.view,
      start = params.start,
      end = params.end,
      filters = {};
    //filter out all records whose reference ids for a given entity type aren't contained in the array of reference ids for that entity type specified in the params (inclusive search)
    update = function (record, refIds){
      return (record.status == 'confirmed' || record.status == 'cancelled')
    },  
    getLookupFilters = function (params){
      var filters = [date],
        allRiders = params.riders == 'all' ? true : false,
        allRestaurants = params.restaurants == 'all' ? true : false;
      if (allRiders && allRestaurants){//use default filter
        return filters;
      } else if (allRiders){
        filters.push(function (record, refIds){//filter out records with restaurants that don't match restaurant refIds from params
          return (refIds.restaurants.indexOf(record.restaurantid) < 0);
        }); 
        return filters;
      } else if (allRestaurants){
        filters.push(function (record, refIds){//filter out records with riders that don't match rider refIds from params
          return (refIds.riders.indexOf(record.riderid) < 0);
        });
        return filters;
      } else {
        filters.push(function(record, refIds){//filter out all records that don't match on both rider id and restaurant id (exclusive search)
          return (refIds.restaurants.indexOf(record.restaurantid) < 0 || refIds.riders.indexOf(record.riderid) < 0);
        });
      }
    },
    filters = {
      grid: [date],
      weekly: [date],
      update: [date, update],
      lookup: getLookupFilters(params)
    };
  return filters[view];      
  } else {
    return date;
  }
};

function getRecordListFromRefIds(model, refIds, filters){
  var recordList = [];
  for (var i = 0; i < model.data.length; i++){
    var record = model.data[i];    
    if (applyFilters(record, refIds, filters)){
      Logger.log('skipping record with id: ' + record.id);
      continue;
    } else {
      Logger.log('adding record with id: ' + record.id);
      recordList.push(record);
    }
  }
  if (recordList.length > 0){
    return recordList;
  } else {
    return {error: 'ERROR: there were no records retrieved for the specified reference ids'}
  }
};

//cycle through all filter functions and return true if any of them return true
function applyFilters(record, refIds, filters){
  for (var i = 0; i < filters.length; i ++){
    Logger.log('Applying the filter to record with id ' + record.id);
    Logger.log('Filter function: ' + filters[i]);
    Logger.log('Filter result: ' + filters[i]);
    if (filters[i](record, refIds)){
      return true;
    }
  }
};

///////////////////////////


function setScheduleView(restaurants, riders, shiftList, view){
  var schedule = constructSheet('Schedule')[view], 
    range = [];
  for (var i = 0; i < shiftList.length; i++){
    var shift = shiftList[i];
    Logger.log('shiftList['+i+'] restaurant id: ' + shift.restaurantid);
    Logger.log('shiftList['+i+'] restaurant name: ' + getNameFromId(restaurants, shift.restaurantid));
    Logger.log('shiftList['+i+'] rider id: ' + shift.riderid);
    if (shift.riderid != undefined) {Logger.log('shiftList['+i+'] rider name: ' + getNameFromId(riders, shift.riderid));}
    
    
    range[i] = [
      shift.id,//id
      shift.start.getDayName(), //weekday
      shift.start.getFormattedDate(), //MM/DD
      shift.start.getFormattedTime(), //start time
      shift.end.getFormattedTime(), //end time
      getPeriod(shift), //period
      getNameFromId(restaurants, shift.restaurantid), //restaurant name
      shift.riderid == undefined ? '' : getNameFromId(riders, shift.riderid), //rider nickname (blank if undefined)
      shift.status,
      shiftList[i].urgency,
      shiftList[i].billing
    ];
  }  
  setSkedCellMap(shiftList, view);
  schedule.clearRange();
  schedule.setRange(range);
};

function getPeriod(shift){
  if (shift.am && shift.pm){
    return 'AM/PM';
  } else if (shift.am){
    return 'AM';
  } else {
    return 'PM';
  }
}

function setSkedCellMap(shiftList, view){
  var cellmap = constructSheet('ScheduleCellMaps')[view],
    range = [];
  for (var i = 0; i< shiftList.length; i++){
    range.push([
      i,//id
      i + 2, //row
      shiftList[i].id//shiftid
    ]);
  }
  cellmap.clearRange();
  cellmap.setRange(range);
};

////// vvv SET GRID MAIN FUNCTION vvv //////

function setGridView(restaurants, riders, shiftList, weekMap){
  var cellMap = constructSheet('ScheduleCellMaps').grid.data,
    grid = constructSheet('Schedule').grid,
    restaurantNames = getNamesFromIds(restaurants, getRefIdsFromRecords(shiftList, 'restaurant')).dedupe().sort(),
    gridMap = getGridMap(restaurants, shiftList, weekMap, restaurantNames),
    range = getGridRange(riders, shiftList, gridMap);
  
  grid.clearRange();
  grid.setRange(range);
  //highlightShifts(range);
  setGridCellMap(gridMap, restaurantNames);
};

////// ^^^ SET GRID MAIN FUNCTION ^^^ //////

////// vvv SET GRID HELPER FUNCTIONS vvv //////


function getGridMap(restaurants, shiftList, weekMap, restaurantNames){
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
  setGridShiftIds(restaurants, shiftList, weekMap, gridMap);
  return gridMap;
};



function setGridShiftIds(restaurants, shiftList, weekMap, gridMap){
  for (var rest in gridMap){
    for (var day in gridMap[rest]){
      for (var period in gridMap[rest][day]){
        gridMap[rest][day][period].shiftIds = getGridShiftIds(restaurants, shiftList, weekMap, rest, day, period);
      }
    }
  }
};


function getGridShiftIds(restaurants, shiftList, weekMap, rest, day, period){
  Logger.log('running getGridShiftIds()');
  var am = (period == 'am') ? true : false,
    pm = !am,
    date = weekMap[day],
    gsIds= [];

  for (var i = 0; i < shiftList.length; i++){
    var shift = shiftList[i];
    Logger.log('testing shiftList['+i+']');
    Logger.log('shift.restaurantid: ' + shift.restaurantid);
    Logger.log('getNameFromId(shift.restaurantid): ' + getNameFromId(restaurants, shift.restaurantid));
    Logger.log('rest: ' + rest);
    if (
      getNameFromId(restaurants, shift.restaurantid) == rest &&
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


function getGridRange(riders, shiftList, gridMap){
  Logger.log('running getGridRange()');
  var range = [];
  for (var rest in gridMap){
    range.push(getGridRow(riders, shiftList, gridMap[rest], rest));
  }
  return range;
};

function getGridRow(riders, shiftList, gridRow, rowName){
  Logger.log('running getGridRow()');
  var row = [];
  row[0] = rowName
  for (var day in gridRow){
    for (var period in gridRow[day]){
      row.push(getGridCellFromShiftIds(riders, shiftList, gridRow[day][period].shiftIds));
    }
  }
  return row;
};


function getGridCellFromShiftIds(riders, shiftList, shiftIds){
  Logger.log('running getGridCellFromShiftIds()');
  var cell = [];
  Logger.log('shiftIds.length: ' + shiftIds.length);
  for (var i = 0; i < shiftIds.length; i++){
    Logger.log('shiftIds['+i+']: ' + shiftIds[i]);
    var shift = shiftList[shiftIds[i]],
      rider = shift.riderid == undefined ? '' : getNameFromId(riders, shift.riderid),
      status = getCodeFromStatus(shift.status);
    cell.push(rider + ' ' + status);
    Logger.log('rider: ' + rider + ', status: ' + status);
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




function setGridCellMap(gridMap, restaurantNames){
  var cellmap = constructSheet('ScheduleCellMaps').grid,
    range = [];
  Logger.log('cellmap.data.length:' + cellmap.data.length);

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
    restaurants = constructSheet('Restaurants').info,
    view = SpreadsheetApp.getActiveSheet().getName(),
    schedule = constructSheet('Schedule')[view],
    shiftList = getShiftListFromView(shifts, riders, schedule, view);  
  for (var i = 0; i < schedule.data.length; i++){
    for (var j in schedule.data[i]){
      Logger.log('schedule.data['+i+']['+j+']: ' + schedule.data[i][j]);
    }
  } 
  
  setShifts(shifts, shiftList);

  //CALLBACKS
  toast('Shifts model successfully updated!');
  //updateAssignments();
  updateCalendars(shifts, riders, restaurants, shiftList);//pass schedule view as an argument to avoid having to call .getActiveSheet() again
};
////// ^^^ UPDATE SHIFTS MAIN FUNCTION ^^^ ///////

////// vvv UPDATE SHIFTS HELPER FUNCTIONS vvv ///////

function getShiftListFromView(shifts, riders, schedule, view){
  var shiftList = [];

  if (view != 'grid'){
    for (var i = 0; i < schedule.data.length; i++){
      var volatileData = getVolatileDataFromScheduleRow(schedule, riders, i),
        shiftListRow = getShiftListRowFromVolatileData(shifts, volatileData);
      shiftList.push(shiftListRow);
    }
  } else {
    var map = constructSheet('ScheduleCellMaps')[view];
    for (var i = 0; i < map.data.length; i++){
      var shiftid = map.data[i].shiftid,
        volatileData = getVolatileDataFromGridCell(schedule, riders, map.data[i]),
        shiftListRow = getShiftListRowFromVolatileData(shifts, volatileData);
      shiftList.push(shiftListRow);
    }
  }
  return shiftList;
};

function getVolatileDataFromScheduleRow(schedule, riders, index){
  var row = schedule.data[index];
  return {
    id: row.id,
    riderid: row.ridernick == undefined ? undefined : getIdFromName(riders, row.ridernick),
    status: row.status,
    urgency: row.urgency,
    billing: row.billing
  };
};

function getVolatileDataFromGridCell(schedule, riders, m){
  var cell = schedule.data[m.row - schedule.row.first][schedule.headers[m.col - schedule.col.first]].split(', '),
    str = cell[m.index],
    ridernick = str.slice(0, str.indexOf('-')).trim(),
    code = str.slice(str.indexOf('-'), str.length).trim();
  Logger.log('ridernick: ' + ridernick);
  Logger.log('ridernick.length: ' + ridernick.length);
  Logger.log(riders.data.length);
  return {
    id: m.shiftid,
    riderid: ridernick.length != '' ? getIdFromName(riders, ridernick) : undefined,
    status: getStatusFromCode(code)
  }
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
};

function getShiftListRowFromVolatileData(shifts, volatileData){
  var id = volatileData.id, 
    row = {};
  for (var j in volatileData){
    row[j] = volatileData[j] == undefined ? '' :  volatileData[j];
  }
  for (var j in shifts.data[id]){
    if (!(j in volatileData)){
      row[j] = shifts.data[id][j];
    } 
  }
  return row;

};

//New ------vvvvv

function formatNewShift(restaurants, riders, row){
  var year = row.date.getYear(),
    month = row.date.getMonth(),
    date = row.date.getDate();

  return {
    start: new Date(year, month, date, row.start.getHours(), row.start.getHours()),
    end: new Date(year, month, date, row.end.getHours(), row.end.getHours()),
    am: row.period.indexOf('AM') > -1 ? true: false,
    pm: row.period.indexOf('PM') > -1 ? true: false,
    restaurantid: getIdFromName(restaurants, row.restaurantname),
    riderid: getIdFromName(riders, row.ridernick),
    urgency: row.urgency,
    billing: row.billing,
    urgency: row.urgency    
  };

};

/*
function getVolatileData(schedule, riders, m, view){ //schedule riders  view shiftid
  if (view != 'grid'){
    return getVolatileDataFromScheduleRow(schedule, riders, m);
  } else {
    return getVolatileDataFromGridCell(schedule, riders, m); 
  }
};
*/



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
        Logger.log('shiftList['+i+']['+k + ']: ' + shiftList[i][k]);
        if (shiftList[i][k] != shifts.data[id][k]){
          Logger.log('writing shiftList['+i+']['+k+'] to shifts.data['+id+']['+k+']')
          shifts.updateCell(shifts.getRowNum(id), shifts.getColNum(k), shiftList[i][k]);
        }
      }
    }
  } 
};


////// ^^^ UPDATE SHIFTS HELPER FUNCTIONS ^^^ ///////


////// vvv UPDATE CALENDAR MAIN FUNCTION vvv //////
function updateCalendars(shifts, riders, restaurants, shiftList){
  var restIds = getRefIdsFromRecords(shiftList, 'restaurant').dedupe(),
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
    var restId = shiftList[i].restaurantid,
      eventId = shiftList[i].eventid,
      statusCode = getStatusCode(riders, shiftList[i].riderid, shiftList[i].status);
      Logger.log('restId: ' + restId);
      Logger.log('eventId:' + eventId);
      Logger.log('statusCode: ' + statusCode);
    //check to see if calendar events exist for all shifts
   if (eventId !== '' && eventId !== 'undefined' && eventId !== undefined){
      //if a event exists, update it
      Logger.log('updating the event with eventId' + eventId);
      getEventById(calendars, restId, eventId).setTitle(statusCode);
   } else {
      //if not, create one
      Logger.log('creating an event for the shift with shiftId: ' + shift.id);
      createEvent(calendars[shift.restaurantid].cal, shiftList, shiftList[i], statusCode);        
   }
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
    return events;
  };

  function getEventById(calendars, restId, eventId){
    Logger.log('running getEventById');
    Logger.log('calendars['+restId+'].events['+eventId+']: ' + calendars[restId].events[eventId]);
    return calendars[restId].events[eventId];
  };

  function createEvent(calendar, shifts, shift, statusCode){
    var event = calendar.createEvent(statusCode, shift.start, shift.end); 
    appendEventId(shifts, shift.id, event.getId());
  }

  function appendEventId(shifts, shiftId, eventId){
    //if in schedule view, update eventid column
    var view = SpreadsheetApp.getActiveSheet().getName()
    if (view != 'grid'){
      var schedule = constructSheet('Schedule')[view];
      schedule.updateCell(schedule.getRowNum(shiftId))
    }
    shifts.updateCell(shifts.getRowNum(shiftId), shifts.getColNum('eventid'), eventId);
  };

  function getStatusCode(riders, riderid, status){
    Logger.log('running getStatusCode()');
    Logger.log('riderid: ' + riderid);
    Logger.log('riderid.length > 0 ? : ' + riderid != '');
    var rider = riderid != '' ? getNameFromId(riders, riderid) : '';
    Logger.log ('rider: ' + rider);
    var  statusCodes = {
        unassigned: '???',
        assigned: '*' + rider + '? (a)',
        delegated: '**' + rider + '?? (d)',
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
