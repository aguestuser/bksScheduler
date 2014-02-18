/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

//*CONSTRUCT SHEET OBJECTS

function constructSheet(sheetName){
  var spreadsheet = sheetName.slice(0, sheetName.indexOf('.')),
    worksheet = sheetName.slice(sheetName.indexOf('.') + 1, sheetName.length), 
    sheets = {
      Riders: {
        key: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
        worksheets: ['info', 'assignments', 'metrics']
      },
      Restaurants: {
        key: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
        worksheets: ['info', 'needs', 'metrics']
      },
      Shifts: {
        key: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
        worksheets: ['shifts']
      },
      Availabilities: {
        key: '0AkfgEUsp5QrAdEdvSWQ0eVRMZmR1RXZRRW13LWY0ZEE',
        worksheets: ['availability']
      },
      Schedule: {
        key: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
        worksheets: ['grid', 'weekly', 'update', 'lookup']
      },
      CellMaps: {
        key: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
        worksheets: ['Schedule', 'Availability']
      }
    },
    sheet = new Sheet(sheets[spreadsheet].key, sheets[spreadsheet].worksheets.indexOf(worksheet));
    sheet['spreadsheet'] = spreadsheet;
    sheet['worksheet'] = worksheet;
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

  //store copy of google apps version of sheet object
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


  this.getColNum = function (headerName){
    return this.headers.indexOf(headerName) + 1;
  };

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

function objectTranspose(obj){
  var arr = [];
  for (var i in obj){
    arr.push(obj[i]);
  }
  return arr;
};

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

//add uppercase first char method to String prototyp
String.prototype.upperFirstChar = function(){
  return this.charAt(0).toUpperCase() + this.slice(1);
};

//add lowercase first char method to String prototyp
String.prototype.lowerFirstChar = function(){
  return this.charAt(0).toUpperCase() + this.slice(1);
};


//add increment date function to Date object prototype
Date.prototype.incrementDate = function(numDays){
  return new Date(this.getTime() + numDays*(24 * 60 * 60 * 1000));
  //return this;
};

//
Date.prototype.setToMidnight = function(){
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
  this.setMilliseconds(0);
  return this;
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
    var result = getIdFromName(model, names[i]);
    if (result.error){
      return result;
    } else {
      ids.push(getIdFromName(model, names[i]));
    }
  }
  return ids; 
};

function getIdFromName(model, name){
  for (var i = 0; i < model.data.length; i++){
    if (model.data[i].name == name){
      return model.data[i].id;
    }
  }
  var error = {error: true, message: 'ERROR: there was no entity found with name: ' + name};
  toast(error.message);
  Logger.log(error.message);
  return error;
};

function getRecordsByIds(model, ids){
  for (var i = 0; i < ids.length; i++){
    records.push(getRecordById(model, id));
  }
  return records;
};

function getActiveIdsFromModel(model){
  var ids = [];
  for (var i = 0; i < model.data.length; i++){
    if (model.data[i].active){ids.push(model.data[i].id);}
  }
  return ids;
};

function getActiveNamesFromModel(model){
  var names = [];
  for (var i = 0; i < model.data.length; i++){
    if (model.data[i].active){names.push(model.data[i].name);}
  }
  return names;
}


function getRecordById(model, id){
  return model.data[id];
};

function getNamesFromIds(model, ids){
  var names = [];
  for (var i=0; i < ids.length; i++){
    names.push(getNameFromId(model, ids[i]));
  }
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
    sheet = constructSheet('Schedule.' + sheetName),
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

///// vvv NEW UPDATE VIEW vvv //////

//*SET VIEW*//
function updateView(e){

//initialize uiApp instance and parameters for shift View object
var app = UiApp.getActiveApplication(), 
  p = e.parameter,
  params = {
    view: {name: p.view, init: 'fromUi'},
    sheets: { 
      self: 'Schedule.' + p.view, 
      model: 'Shifts.shifts',
      refs: {
        restaurants: {model: 'Restaurants.info', gridCoord: 1, names: p.restaurants},
        riders: {model: 'Riders.info', gridCoord: 2, names: p.riders}
      }
    },
    dates:{start: p.start, end: p.end},
    filters: {
      update:{matchAttrs: {attr: 'status', values: ['unassigned', 'assigned', 'delegated']}},
      lookup: {matchRefs: {type: 'exclusive'}}
    }
  };

  //initialize schedule view
  schedule = new View(params);
  //print from schedule view to spreadsheet
  schedule.writeToSelf();
  //close ui
  return app.close();
};

/*
self: {
  view: *sheetName*,
  model: *sheetName*,
  volatiles: {*viewName*: [arr], *viewName*: [arr]}
refs: {
  *refName*: {model: , names: , primary: true}
  *refName*: {model: , names, primary: false}
}
targets: {
  *targetName*: {
    model: ,
    matchOn: ,
    volatiles: ,
    callbacks: ,
    primary: ,
  }
grid: {
  ref1: ,
  ref2: ,
  gridMap: ,
  cellMap: {
    view: ,
    model: 
  }
}
}
*/

function updateShifts(){

  var viewName = SpreadsheetApp.getActiveSheet().getName(),
    params = {
    view: {name: viewName, init: 'fromSelf'},
    sheets: {
      self: 'Schedule.' + viewName,
      model: 'Shifts.shifts',
      refs: {
        restaurants: {model: 'Restaurants.info', gridCoord: 1},
        riders: {model: 'Riders.info', gridCoord: 2}
      },
      targets: {
        shifts: {
          model: 'Shifts.shifts', 
          matchOn: ['id'],
          volatiles: ['riderid', 'status', 'billing', 'urgency'],
          callbacks: ['writeToGrid', 'writeToUpdate'],
          primary: true
        },
        availability: {
          model: 'Availabilities.availabilities',
          matchOn: ['riderid', 'start', 'end', 'period'],
          volatiles: ['id', 'status'],
          callbacks: ['highlightConflicts'],
          primary: false
        }
      }
    },
    volatiles: {
      grid: ['riderid', 'status'],
      list: ['riderid', 'status', 'billing', 'urgency']
    }
  }

  schedule = new View(params);
  schedule.writeToModel();

};

//*** VIEW CONSTRUCTOR FUNCTION ***//

function View(p){
  
  var self = this;
  
  //*ATTRIBUTES*//

  this.view = {
    name: p.view.name,
    type: p.view.name == 'grid' ? 'grid' : 'list',
    init: p.view.init
  };
  this.sheets ={
    self: constructSheet(p.sheets.self),
    model: constructSheet(p.sheets.model),
    refs: initRefs(p.sheets.refs)
  };
  initGreedyRefAccessors();

  this.sheets.cellmap = constructSheet('CellMaps.' + this.sheets.self.spreadsheet);
  this.grid = initGrid();

  if (this.view.init == 'fromUi'){
    this.dates = initDatesFromUi(p.dates);
    this.filters = initFilters(p.filters, p.view.name);
    this.grid = initGrid();
    this.recordList = initRecordListFromModel();//virtual map of all records referenced in this view
  } else if (this.view.init == 'fromSelf'){
    //this.sheets['targets'] = initTargets(p.sheets.targets);
    this.volatiles = p.volatiles[this.view.type];
    this.recordList = initRecordListFromSelf();//virtual map of all records referenced in this view
    this.dates = initDatesFromSelf(); 
  }

  this.grid.gridMap = initGridMap();
  this.range = initRange();//blank 2d array mapping values from record list to be displayed as spreadsheet cell values in this view

  //**METHODS*//

  this.writeToSelf = function (){
    this.sheets.self.clearRange();
    this.sheets.self.setRange(this.range);
    if (this.view.type == 'grid') {this.writeToCellMap();}
    return this;
  };

  this.writeToCellMap = function (){
    var gMap = this.grid.gridMap,
      range =[];
  
    //build cellmap range from grid row data
    for (var ref1Name in gMap){
      for (var day in gMap[ref1Name]){
        for (var period in gMap[ref1Name][day]){
          for (var j = 0; j < gMap[ref1Name][day][period].recordIds.length; j++){
            range.push([
              this.grid.ref1.names.indexOf(ref1Name) + 2,//row
              gMap[ref1Name][day][period].col,//col
              j,//index 
              gMap[ref1Name][day][period].recordIds[j]//shiftId
            ]);
          }
        }
      }
    }
    //prepend cellMap id to first cell of each row in range
    for (var i = 0; i < range.length; i++){
      range[i].unshift(i);
    }    
    this.sheets.cellmap.clearRange();
    this.sheets.cellmap.setRange(range);
    return this;
  };

  this.writeToModel = function(){
    var model = this.sheets.model;
    for (var i = 0; i < this.recordList.length; i++){//match record list rows to model rows by id
      var id = this.recordList[i].id;
      if (id == undefined || id == 'new'){//if the view's id attr indicates a new record, create one 
        this.writeNewRecordToModel(this.recordList[i]);
      } else {//otherwise, overwrite all cells in model whose values don't match those in the record list
        for (var j = 0; j< this.volatiles.length; j++){
          var vol = this.volatiles[j];
          if (this.recordList[i][vol] != model.data[id][vol]){
            model.updateCell(model.getRowNum(id), model.getColNum(vol), this.recordList[i][vol]);
          }
        }        
      }
    }
    toast('Updated '+ model.g.getName() +' model!');
    this.sheets.model = constructSheet('Shifts.shifts');//refresh view object's virtual copy of model
    
    if (this.view.type == 'list'){
      if (this.view.name =='update'){
        this.reconcileUpdateView();
      }
      //this.writeToGrid();
    }
    return this;
  };

  this.writeToGrid = function (){
    var grid = this.sheets.self.g.getParent().getSheetByName('grid');
    grid.clearRange();
    grid.setRange(initGridRange());
    toast('Updated grid!')
    return this;
  };

  this.reconcileUpdateView = function (){
    for (var i = 0; i < this.range.length; i++){
      var id = this.range[i][this.sheets.model.headers.indexOf('id')],
        status = this.sheets.model.data[id].status;
      if (status == 'confirmed' || status == 'cancelled'){
        range.splice(i, 1);
      }
    }
    toast('Reconciled update list!')
    return this;
  };

  this.writeNewRecordToModel = function(record){
    var range = [];
    record[id] = this.model.row.last -1;//set the new record's id to one greater than the last id in the model
    for (var i = 0; i < this.model.headers.length; i++){
      range.push(getListCellVal(row, this.model.headers[i]));
    }
    this.model.g.appendRow(range);
    return this;
  };

  this.writeToTargets = function (){
    for (var target in targets){

    }
  };


  //**ACCESSOR METHODS **//
  function initGreedyRefAccessors(){
    
    self.getNonGreedyRefs = function(){
      var ngRefs = {};
      for (var ref in self.sheets.refs){
        if (!self.sheets.refs[ref].greedy){
          ngRefs[ref] = self.sheets.refs[ref];
        }
      }
      return ngRefs;
    };
    
    self.getGreedyRefs = function(){
      var gRefs = {};
      for (var ref in self.sheets.refs){
        if (self.sheets.refs[ref].greedy){
          gRefs[ref] = self.sheets.refs[ref];
        }
      }
      return gRefs;
    };  
 
  };


  //*INITIALIZATION FUNCTIONS*//

  function getErrorStr(errorObj){
    var str = '';
    if ('errors' in errorObj){//concatenate error messages from error objects with multiple errors
      for (var error in errorObj.errors){
        str.concat(error.message + '\n');
      } 
    } else {//for single errors, return single error message
      str.concat(errorObj.message);
    }
    return str;
  };

  function initRefs(prefs) {
    var refs = {};
    for (var ref in prefs){
      Logger.log('Initalizing ref for: ' + ref);
      refs[ref] = prefs[ref];
      refs[ref]['model'] = constructSheet(prefs[ref].model);
      refs[ref]['gridCoord'] = prefs[ref].gridCoord;
      refs[ref]['modelName'] = ref;
      refs[ref]['refNameKey'] = ref.slice(0, -1);
      refs[ref]['refIdKey'] = refs[ref].refNameKey + 'id';
      if (self.view.init == 'fromUi'){//only initialize ref.names if initializing from ui (not available yet if initializing from self)
        Logger.log('Initializing from ui');
        refs[ref]['names'] = prefs[ref].names.split(', ');//transpose ref entity names from string to array
        var names = refs[ref].names;
        Logger.log('names: ' + names);
        if (names == 'all'){
          refs[ref].greedy = true;
          refs[ref].ids = getActiveIdsFromModel(refs[ref].model);
          refs[ref].names = getActiveNamesFromModel(refs[ref].model);//reset names from 'all' to list of all actual names in ref model
          Logger.log('names: ' + names);
        } else {
          refs[ref].greedy = false;
          Logger.log('Trying to get ids from names!');
          Logger.log('names: ' + names);
          Logger.log('refs['+ref+'].modelName: ' + refs[ref].modelName);
          Logger.log('refs['+ref+'].model: ' + refs[ref].model);
          var result = getIdsFromNames(refs[ref].model, names);//store result and check for errors
          Logger.log('result: ' + result);
          if (result.error){
            refs['errors'][ref] = {
              error: true, 
              message: 'ERROR: a list of ' + ref + ' ids could not be retrieved because the user tried to search for a '+ ref +'name that does not exist.'
            };       
          } else {//if no errors, add retrieved ids to the view object's ref object
            refs[ref].ids = result;
          }
        }
      }
    } 
    Logger.log('Completed initRefs()!');
    if (refs.errors != undefined){
      toast(getErrorStr(refs.errors));
      Logger.log(getErrorStr(refs.errors));
      return refs.errors
    } else {
      return refs;
    }
  };

  function initGrid(){
    var refs = self.sheets.refs,
      grid = {};
    for (var ref in refs){
      if (refs[ref].gridCoord == 1) {grid['ref1'] = refs[ref];}
      if (refs[ref].gridCoord == 2) {grid['ref2'] = refs[ref];}
    }
    return grid;
  };

  function initDatesFromUi(pdates) {
    var dates = {
      start: pdates.start.setToMidnight(),
      end: pdates.end.setToMidnight()      
    };
    if (self.view.name != 'lookup'){
      dates['weekMap'] = dates.start.getWeekMap();
    }
    return dates;
  };

  function initFilters(pfilters, view){
    if (self.sheets.refs.errors == undefined){//only proceed if no errors initializing refs
      //
      if (self.view.name == 'lookup'){//retroactively set params to include non-gredy refs if in lookup view
        pfilters.lookup.matchRefs.ngRefs = self.getNonGreedyRefs();
        var ngRefs = pfilters.lookup.matchRefs.ngRefs;
        Logger.log('ngRefs contents::')
        for (var i in ngRefs) {
          for (var j in ngRefs[i])
          Logger.log('ngRefs['+i+']['+j+']: ' +ngRefs[i][j]);
        };

      }

      //create empty array to store filtering functions
      var filterArr = [],
        filters = {
          // if a record's start time is before or after the start and end in params, filter it
          date: {
            args: {start: self.dates.start, end: self.dates.end},
            func: function(record, args){
              return (record.start.getTime() < args.start.getTime() || record.start.getTime() > args.end.getTime() + 86400000);
            }       
          },
          //if a record attribute doesn't match the values for that attribute specified in params, filter it
          matchAttrs: {
            args: {attr: undefined, values: undefined},
            func: function(record, args){
              if (args.values.indexOf(record[args.attr]) < 0){
                return true;
              } else {
                return false;
              }
            }
          },
          matchRefs: {
            args: {type: undefined, ngRefs: undefined},
            func: function(record, args){
              Logger.log('**Running matchRefs');
              var filter = args.type == 'exclusive' ? false : true; //default to not filter in exclusive search to filter in inclusive
              Logger.log('init filter val: ' + filter);
              Logger.log('args.type: ' + args.type);
              Logger.log('args.ngRefs: ' + args.ngRefs);

              for (var ref in args.ngRefs){
                var argRef = args.ngRefs[ref];
                Logger.log('ref model name:' + argRef.modelName);
                if (args.type == 'exclusive'){//filter if ids of *any* ref models don't match  
                  Logger.log('record id:' + record[argRef.refIdKey]);
                  Logger.log('model id: ' + argRef.model.data.id);
                  if (argRef.ids.indexOf(record[argRef.refIdKey]) < 0){
                    filter = true;
                  }
                } else {//filter if ids of *all* ref models don't match
                  if (argRef.ids.indexOf(record[argRef.refIdKey]) >= 0){
                    filter = false;
                  }
                }
              }
              return filter;
            }
          }
        };

      filterArr.push(filters.date);//always include date filter at first index of filters array

      //find filters given in params and set their arguments to those specified in params
      for (var filter in pfilters[view]){//loop through filters corresponding to view given in params
        for (var arg in pfilters[view][filter]){//loop through each fitler's args as given in params 
          Logger.log('pfilters['+view+']['+filter+']['+arg+']: ' + pfilters[view][filter][arg]);
          if (arg in filters[filter].args){//find arg names in filter that match arg names in params 
          Logger.log('pfilters['+view+']['+filter+']['+arg+']: ' + pfilters[view][filter][arg]);
            filters[filter].args[arg] = pfilters[view][filter][arg];//initialize filter arguments to values of corresponding args in params  
          }
        }
        filterArr.push(filters[filter]); //add initialized filter to filters array
      }
      Logger.log('Completed initFilters()!')
      Logger.log('filterArr.length: ' + filterArr.length);
      Logger.log('filterArr.contents: ');
      for (var i = 0; i < filterArr.length; i++) {
        Logger.log('filterArr['+i+'].func: ' + filterArr[i].func);
      };
      return filterArr;
    }
  };

  function initGridMap(){
    Logger.log('Running initGridMap()!');
    self.grid.ref1.names = self.view.init == 'fromUi' ? getRef1NamesFromRecordList() : getRef1NamesFromSelf();
    var gridMap = {};
    for (var i = 0; i < self.grid.ref1.names.length; i++){
      gridMap[self.grid.ref1.names[i]] ={
        mon: {
          am: {recordIds: [], col: 2}, 
          pm: {recordIds: [], col: 3}
        },
        tue: {
          am: {recordIds: [], col: 4}, 
          pm: {recordIds: [], col: 5}
        },
        wed: {
          am: {recordIds: [], col: 6}, 
          pm: {recordIds: [], col: 7}
        },
        thu: {
          am: {recordIds: [], col: 8}, 
          pm: {recordIds: [], col: 9}
        },
        fri: {
          am: {recordIds: [], col: 10}, 
          pm: {recordIds: [], col: 11}
        },
        sat: {
          am: {recordIds: [], col: 12}, 
          pm: {recordIds: [], col: 13}
        },
        sun: {
          am: {recordIds: [], col: 14}, 
          pm: {recordIds: [], col: 15}
        } 
      };        
    }

    for (var ref in gridMap){
    }
    return gridMap;
  };

  function getRef1NamesFromRecordList(){//remove ref1 names whose ids aren't in the record list
    var idKey = self.grid.ref1.refIdKey,
      names = self.grid.ref1.names,
      recordIds = [],
      newNames = [];
    for (var i = 0; i < self.recordList.length; i++){
      recordIds.push(self.recordList[i][idKey]);
    }
    return getNamesFromIds(self.grid.ref1.model, recordIds.dedupe());
  };


  function getRef1NamesFromSelf(){//pull ref1 names names from first column of grid view
    var ref1Key = self.grid.ref1.modelName,
      names = [];
    for (var i = 0; i < self.sheets.self.data.length; i++){
      names.push(self.sheets.self.data[0][ref1Key]);
    }
    return names;
  };


  function initRecordListFromModel(){
    if (self.sheets.refs.errors == undefined){//only proceed if there were no errors initializing refs
      var recordList = [];
      for (var i = 0; i < self.sheets.model.data.length; i++){  
        var record = self.sheets.model.data[i];
        if (applyFilters(record)){//if a record matches filter criteria, skip it
          continue;
        } else {//if not, add it to record list
          recordList.push(record);
        }
      }
      Logger.log('completed initRecordListFromModel()!');
      if (recordList.length > 0){
        return recordList;
      } else {
        var error = {error: true, message:'ERROR: there were no records retrieved for the specified reference ids'};
        toast(getErrorStr(error));
        Logger.log(getErrorStr(error));
        return error;
      }      
    }      
  };



  //cycle through all filter functions and return true if any of them return true
  function applyFilters(record){
    Logger.log('Running apply filters on record w/ id: ' + record.id);
    Logger.log('self.filters.length: ' + self.filters.length);
    for (var i = 0; i < self.filters.length; i ++){
      Logger.log('Running filter w/ index: ' + i);
      Logger.log('result of filter: ' + self.filters[i].func(record, self.filters[i].args));
      if (self.filters[i].func(record, self.filters[i].args)){//if any filter returns true, return true
        return true;
      } 
    }
    return false;//if no filters return true, return false
  };

  /// ** vv FUNCTIONS FOR INITALIZATION FROM SELF vv **//

  function initTargets(ptargets){
    var targets = {};
    for (var target in ptargets){
      targets[target] = {
        model: constructSheet(ptargets[target].model),
        matchOn: ptargets[target].matchOn,
        volatiles: ptargets[target].volatiles,
        callbacks: ptargets[target].callbacks,
        primary: ptargets[target].primary
      }
    }
  };

  function initRecordListFromSelf(){
    var recordList = [];
    if (self.view.type == 'list'){
      for (var i = 0; i < self.sheets.self.data.length; i++){
        var volatileData = getVDFromListRow(self.sheets.self.data[i]),
          recordListRow = getRecordListRowFromVD(volatileData);
        recordList.push(recordListRow);
      }
    } else {
      var map = self.sheets.cellmap;
      for (var i = 0; i < map.data.length; i++){
        var volatileData = getVDFromGridCell(map.data[i]),
          recordListRow = getRecordListRowFromVD(volatileData);
        recordList.push(recordListRow);
      }
    }
    return recordList;
  };  

  function getVDFromListRow(row){
    var vd = {id: row.id};
    for (var i = 0; i < self.volatiles.length; i++){//change to self.self.volatiles after restructuring params
      var vol = self.volatiles[i];
      if (vol.indexOf('id') > 0){//if volatile is a ref id, look up ref id from ref name
        var refKey = vol.slice(0, -2),
          ref = refKey+'s';
        vd[vol] = row[refKey] == undefined ? undefined : getIdFromName(self.sheets.refs[ref].model, row[refKey]); //handle empty cells 
      } else {
        vd[vol] = row[vol];
      }

    }
    return vd;
  };

  function getVDFromGridCell(m){
    var cell = self.sheets.self.data[m.row - self.sheets.self.row.first][self.sheets.self.headers[m.col - self.sheets.self.col.first]].split(', '),
      str = cell[m.index],
      refName = str.slice(0, str.indexOf('-')).trim(),
      code = str.slice(str.indexOf('-'), str.length).trim(),
      vd = {
        id: m.id,
        status: getStatusFromCode(code)
      },
      refId = refName != '' ? getIdFromName(self.grid.ref2.model, refName) : undefined;
      refIdKey = self.grid.ref2.modelName.slice(0, -1).concat('id');
      vd[refIdKey] = refId;

    return vd;
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

  function getRecordListRowFromVD(vd){
    var id = vd.id, 
      row = {};
    for (var attr in self.sheets.model.data[id]){
      if (attr in vd){//if a model attribute is volatile, retrieve attribute value from volatile data array
        row[attr] = vd[attr] == undefined ? '' : vd[attr];//correct for undefined cell values
      } else {//otherwise retrieve attribute value from the model
        row[attr] = self.sheets.model.data[id][attr];
      }
    }
    return row;
  };

  function initDatesFromSelf(){
    var input = self.recordList[0].start.setToMidnight();
    if (self.view.name == 'lookup'){
      return initDatesFromLookup(input);
    } else {
      var weekMap = input.getWeekMap();
      return {
        start: weekMap['Monday'],
        end: weekMap['Sunday'],
        weekMap: weekMap
      };
    }
  };

  function initDatesFromLookup(input){
    var start = input,
      end = start,
      weekMap = {};
    for (var i = 0; i < recordList.length; i++) {
      if (recordList[i].start < start){
        start = recordList[i].start.setToMidnight();
      } else if (recordList[i].start > end){
        end = recordList[i].start.setToMidnight();
      }
    }
    weekMap = start.getWeekMap();
    return {
      start: start,
      end: end,
      weekMap: weekMap
    }
  };


  /// ** ^^ FUNCTIONS FOR INITALIZING FROM SELF ^^ **//


  //** vvv RANGE INITIALIZATION FUNCTIONS vvv **//
  function initRange(){
    if (self.recordList.error == undefined){//only proceed if there were no errors retrieving record list
      if (self.view.type == 'list'){
        return initListRange();
      } else {
        return initGridRange();
      }      
    }
  };

  function initListRange(){
    var headers = self.sheets.self.headers;
      range = [];
    for (var i = 0; i < self.recordList.length; i++)  {
      range[i] = [];
      for (var j = 0; j < headers.length; j++){
        range[i].push(getListCellVal(self.recordList[i], headers[j]));
      }
    }
    return range;
  };

  function getListCellVal(record, header){
    if (header in record){//if the data type in the record list matches the data type specified by the header, return the value without formatting
      return record[header];
    } else if (header+'s' in self.sheets.refs){//if the header refers to a ref name, return the name corresponding to the ref id      
      return record[header+'id'] == undefined ? '' : getNameFromId(self.sheets.refs[header+'s'].model, record[header+'id']);
    } else {//otherwise format the value according to the following patterns
      var headers = {
        day: record.start.getDayName(),
        date: record.start.getFormattedDate(),
        start: record.start.getFormattedTime(),
        end: record.end.getFormattedTime(),
        period: getFormattedPeriod(record.am, record.pm)
      }
      return headers[header];
    }
  };

  function getFormattedPeriod(am, pm){
    period = '';
    if (am && pm){
      return 'AM/PM';
    } else if (am){
      return 'AM';
    } else if (pm){
      return 'PM';
    }
  };

  function initGridRange(){
    Logger.log('running initGridRange()!');
    initGridRecordIds();
    var range = [];
    for (var ref1 in self.grid.gridMap){
      range.push(getGridRow(ref1));
    }
    return range;  
  };

  function getGridRow(ref){
    var row = [];
    row[0] = ref;
    for (var day in self.grid.gridMap[ref]){
      for (var period in self.grid.gridMap[ref][day]){
        row.push(getGridCellValsFromRecordIds(self.grid.gridMap[ref][day][period].recordIds));
      }
    }
    return row;
  };

  function getGridCellValsFromRecordIds(recordIds){
    var cell = [];
    for (var i = 0; i < recordIds.length; i++){
      var record = self.recordList[recordIds[i]],
        ref2IdKey = self.grid.ref2.modelName.slice(0, -1).concat('id'),
        ref2Name = record[ref2IdKey] == undefined ? '' : getNameFromId(self.grid.ref2.model, record[ref2IdKey]),
        status = getCodeFromStatus(record.status);
      cell.push(ref2Name + ' ' + status);
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

  function initGridRecordIds(){
    var gridMap = self.grid.gridMap;
    for (var refName in gridMap){
      for (var day in gridMap[refName]){
        for (var period in gridMap[refName][day]){
          gridMap[refName][day][period].recordIds = getGridCellRecordIds(refName, day, period);
        }
      }
    } 
  };
  
  function getGridCellRecordIds(refName, day, period){
    var am = (period == 'am') ? true : false,
      pm = !am,
      date = self.dates.weekMap[day],
      ref1IdKey = self.grid.ref1.modelName.slice(0, -1).concat('id'),
      ref1Id = getIdFromName(self.grid.ref1.model, refName),
      ids= [];

    for (var i = 0; i < self.recordList.length; i++){
      var record = self.recordList[i];
      if (
        record[ref1IdKey] == ref1Id &&
        record.am == am && 
        record.pm == pm && 
        record.start.getYear() == date.getYear() &&
        record.start.getMonth() == date.getMonth() &&
        record.start.getDate() == date.getDate()
      ) {
        ids.push(record.id);
      }
    }
    return ids;
  };

  //** ^^ range initialization functions ^^ **//


};

///// ^^^ NEW UPDATE VIEW ^^^ //////


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
      var schedule = constructSheet('Schedule.'+view);
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


function initGetFreeRidersUi(){

};

function getFreeRiders(){

};

function getShiftsFromNeeds(){

};

