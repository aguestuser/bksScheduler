/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

//MASTER!

//*CONSTRUCT SHEET OBJECTS

function constructSheet(sheetName){
  var spreadsheet = sheetName.slice(0, sheetName.indexOf('.')),
    worksheet = sheetName.slice(sheetName.indexOf('.') + 1, sheetName.length), 
    sheets = {
      riders: {
        key: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
        worksheets: ['info', 'assignments', 'metrics']
      },
      restaurants: {
        key: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
        worksheets: ['info', 'needs', 'metrics']
      },
      Shifts: {
        key: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
        worksheets: ['index']
      },
      Availabilities: {
        key: '0AkfgEUsp5QrAdEdvSWQ0eVRMZmR1RXZRRW13LWY0ZEE',
        worksheets: ['index']
      },
      Schedule: {
        key: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
        worksheets: ['grid', 'weekly', 'update', 'lookup']
      },
      ScheduleParams: {
        key: '0AkfgEUsp5QrAdHp6Q2dES0Z5Tm9YOGZsSWRnUEFuX0E',
        worksheets: ['grid', 'weekly', 'update', 'lookup']
      },
      ScheduleCellMaps: {
        key: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
        worksheets: ['grid', 'weekly', 'update', 'lookup']
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
  var self = this;

  //store copy of google apps version of sheet object
  this.g = SpreadsheetApp.openById(key).getSheets()[index];
  
  //offset row/col picker for UI if the sheet in question is the schedule, otherwise set R,C of first cell to 2,1
  this.col = {
    first: 1,
    getLast: function(){return self.g.getLastColumn()},
    getNum: function(){return self.g.getLastColumn()}
  };
  this.row = {
    first: 2,
    getLast: function(){return self.g.getLastRow()},
    getNum: function(){return self.g.getLastRow() - 2 + 1}
  };

  //translate row data to JSON (see script below)
  this.data = getRowsData(this.g, this.g.getRange(this.row.first, this.col.first, this.row.getLast(), this.col.getLast()), 1);

  //create array of header names
  this.headers = normalizeHeaders(this.g.getRange(1, 1, 1, this.col.getLast()).getValues()[0]);

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
    return this.g.getRange(row, this.col.first, 1, this.col.getNum());    
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
      .getRange(this.row.first, this.col.first, this.row.getNum(), this.col.getNum())
      .clear({contentsOnly:true});
  };

  this.setRange = function (range){
    Logger.log('.setRange range: ' + range);
    Logger.log('range.length: ' + range.length);
    Logger.log('typeof(this): ' + typeof(this));
    Logger.log('typeof(range): ' + typeof(this));
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
    view: {
      name: p.view, 
      init: 'fromUi', 
      self: 'Schedule', 
      model: 'Shifts'
    },
    refs: [{class: 'restaurants', instance: 'info', names: p.restaurants}, {class: 'riders', instance:'info', names: p.riders}],
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

function updateShifts(){

  var sp = {
        view: {name: SpreadsheetApp.getActiveSheet().getName(), init: 'fromRange', self: 'Schedule', model: 'Shifts'},
        refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance:'info'}],
        volatiles: {grid: ['riderid', 'status'], list: ['riderid', 'status', 'billing', 'urgency']}
      };


  schedule = new View(sp);
  schedule.writeToModel().refreshViews(['grid', 'weekly', 'update', 'lookup']);

  /*
  var ap = {
    view: {name: 'weekly', init: 'fromRel', self: 'Availability', model: 'Availabilities'},
    refs: [{class: 'riders', instance: 'info'}, {class: 'restaurants', instance: 'info'}],
    dates:{start: schedule.dates.start, end: schedule.dates.end},
    rel: schedule,
    filters: {
      update:{matchAttrs: {attr: 'status', values: ['unassigned', 'assigned', 'delegated']}},
      lookup: {matchRefs: {type: 'exclusive'}}
    }
  };

  avail = new View (ap);

  if (schedule.getConflictsWith(avail).hasConflicts){
    schedule.highlightConflicts();
  } else {
    avail
      .reconcileWith(schedule, 'shiftid', ['status', 'restaurantid', 'start', 'end'])
      .refreshViews();
    schedule
      .refreshViews(['grid', 'weekly', 'update', 'lookup'])
      .sendEmails()
      .writeToCalendar();
  }

  */


};

//*** VIEW CONSTRUCTOR FUNCTION ***//

function View(p){
  
  var self = this;
  this.p = p;
  if (p.view.init == 'fromUi'){cacheParams(p);}

  //*ATTRIBUTES*//

  this.errors = {};
  
  this.view = {
    name: p.view.name,
    type: p.view.name == 'grid' ? 'grid' : 'list',
    init: p.view.init,
    class: p.view.self,
    modelClass: p.view.model
  };

  this.sheets = {
    self: constructSheet(p.view.self + '.' + p.view.name),
    model: constructSheet(p.view.model + '.' + 'index'),
    cellmap: constructSheet(this.view.class +'CellMaps.' + this.view.name),
    paramCache: constructSheet(p.view.self + 'Params.' + p.view.name), 
    refs: {}
  };

  initRefs(p.refs);    

  Logger.log('this.view.init: ' + this.view.init);


  if (this.view.init == 'fromUi' || this.view.init == 'fromView'){
    this.dates = initDatesFromParams();
    this.filters = initFilters(p.filters);
    this.recordList = initRecordListFromModel();//virtual map of all records referenced in this view

  } else if (this.view.init == 'fromRange'){
    this.dates = initDatesFromCache();
    Logger.log('initialized dates.');
    this.volatiles = p.volatiles[this.view.type];
    this.recordList = initRecordListFromSelf();//virtual map of all records referenced in this view
  } 

  reconcileRefs(); //make callback from initRecordList

  this..gridMap = initGridMap();//initializing gridMap requires recordList to be already be initialized

  this.range = initRange();//blank 2d array mapping values from record list to be displayed as spreadsheet cell values in this view

  //**METHODS*//

  this.writeToSelf = function (){
    Logger.log('starting .writeToSelf()');
    var range = [];
    if (this.range == undefined){
      range[0] = ['Nothing found!'];
      toast('There were no records found matching those parameters!');
    } else {
      range = this.range;
    }
    this.sheets.self.clearRange();
    this.sheets.self.setRange(range);
    if (this.view.type == 'grid') {this.writeToCellMap();}
    return this;
  };

  this.writeToCellMap = function (){
    Logger.log('running this.writeToCellMap()');
    var gm = this..gridMap,
      id = 0,
      range =[];
    Logger.log('gm: ' + gm);
    Logger.log('gm.length: ' + gm.length);
  
    //build cellmap range from grid row data
    for (var i = 0; i < gm.length; i++){
      for (var day in gm[i].info){
        for (var period in gm[i].info[day]){
          Logger.log('gm['+i+'].info['+day+']['+period+'].recordIds: ' + gm[i].info[day][period].recordIds)
          for (var j = 0; j < gm[i].info[day][period].recordIds.length; j++){
            id++;
            Logger.log('id: ' + id)
            range.push([
              id,//id
              i + 2,//row
              gm[i].info[day][period].col,//col
              j,//index 
              gm[i].info[day][period].recordIds[j]//recordid
            ]);
          }
        }
      }
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
        this.writeNewRecordToModel(this.recordList[i], i);
      } else {//otherwise, overwrite all cells in model whose values don't match those in the record list
        for (var j = 0; j< this.volatiles.length; j++){
          var vol = this.volatiles[j];
          if (this.recordList[i][vol] != model.data[id][vol]){
            model.updateCell(model.getRowNum(id), model.getColNum(vol), this.recordList[i][vol]);
          }
        }        
      }
    }
    toast('Updated '+ model.g.getParent().getName() +' model!');
    this.sheets.model = constructSheet(this.sheets.self.spreadsheet + '.' + this.sheets.self.worksheet);//refresh view object's virtual copy of model
    
    return this;
  };

  this.writeNewRecordToModel = function(record, i){
    var range = [];
    record.id = this.sheets.model.g.getLastRow() -2 + 1;//set the new record's id to one greater than the last id in the model
    this.recordList[i].id = record.id;//append new id to record list
    this.range[i][0] = record.id;//append new id to range
    for (var i = 0; i < this.sheets.model.headers.length; i++){
      var val = getListCellVal(record, this.sheets.model.headers[i]);
      if (val == undefined){//substitute empty string for undefined values
        range.push('');
      } else {
        range.push(val);        
      }
    }
    this.sheets.model.g.appendRow(range);
    return this;
  };

  this.refreshViews = function(views){
    Logger.log('Running .refreshViews()!')
    for (var i = 0; i < views.length; i++) {
      var p = this.p,//retrieve core paramaters for view class from this view instance's paramaters 
        p2 = getParamsFromCache(this.view.class, views[i]);//retrieve paramaters for view instance to be refreshed

      p.refs[0].names = p2.ref0Names;//modify core params according to values stored for foreign instance
      p.refs[1].names = p2.ref1Names;
      p.dates = {start: p2.start, end: p2.end};

      p.view.init = 'fromView';//add params specifying initialization from view (and view instance)
      p.view.name = views[i];

      p.filters = {//add filter params (not specified when initializing from range)
        update:{matchAttrs: {attr: 'status', values: ['unassigned', 'assigned', 'delegated']}},
        lookup: {matchRefs: {type: 'exclusive'}}
      };
     
      var altView = new View(p);//construct view object for other view instance
      altView.writeToSelf();//call .writeToSelf() to refresh the view instance
      toast('Updated ' + views[i] + ' view!');
    }
    return this;
  };


  this.getConflictsWith = function(View){
    var viewRl = this.getRecordsSortedByRef(this.sheets.refs[0]),
      relRl = View.getRecordsSortedByRef(View.sheets.refs[1]);
    this.conflicts = getConflicts(viewRl, relRl);
    setConflictStatuses(this.conflicts);
    return this;
  };

  this.hasConflicts = function(){
    if (this.conflicts.length > 0){return true;} else{return false;}  
  };

  this.highlightConflicts = function(){
    var range = [];
    for (var i = 0; i < this.conflicts.length; i++) {
      if (this.view.type == 'list'){
        range = this.sheets.self.g.getRange(getRowFromRecordId(conflicts[i]), this.sheets.self.col.first, 1, this.sheets.self.col.getLast());
      } else {
        var gc = getGridRowColFromRecordId(conflicts[i]),
          row = gc.row,
          col = gc.col,
          range = this.sheets.self.g.getRange(row, col, 1, 1);  
      }
        range.setBackground('#FF00FF');
    }
  };

  /*
  this.reconcileWith = function (View, matchId, volatiles){
    for (var i = 0; i < View.recordList.length; i++) {
      for (var j = 0; j < recordList.length; j++){
        if(this.recordList[i][matchId] == View.recordList)        
      }
    }
  };
  */

//store references between availabilities and shifts (call them relatives?)
//-> each shift record contains a reference to an avail record
//-> each avail record contains a reference to a shift record (if one has been assigned)
//-> will make this.reconcileWith() much faster, because the method can match direclty instead of looping htrough every shift record, then every vail record

  function getConflicts(viewRl, relRl){   
    for (var ref in viewRl) {
      for (var i = 0; i < viewRl[ref].length; i++) {
        var r1 = viewRl[ref][i];
        for (var j = 0; j < relRl[ref].length; j++){
          if (viewRl[ref][i].start.getDate() == relRl[ref][j].date && (viewRl[ref][i].am == relRl[ref][j].am || viewRl[ref][i].pm == relRl[ref][j].pm)){//match on day and period
            if (relRl[ref][j].status == 'not free'){
              conflicts.push({viewId: viewRl[ref][i].id, relId: rel2[ref][id]});//?????
            }
          }
        }
      }
    }
  };

  function setConflictStatuses(conflicts){
    for (var i = 0; i < conflicts.length; i++) {
        self.recordList[conflicts[i].viewId].conflict = true;
    }
  };


  //**ACCESSOR METHODS **//


  this.getref0 = function(){    
    return this.sheets.refs[0];
  };

  this.getref1 = function(){   
    return this.sheets.refs[1];
  };

  this.getRecordsSortedByRef = function (ref){
    var records = {};
    for (var i = 0; i < ref.ids.length; i++) {
      records[ref.ids[i]]=[];
      for (var j = 0; j < self.recordList.length; j++){
        if (recordList[j][ref.idKey] = ref.ids[i]){
          records[ref.ids[i]].push(recordList[j]);
        }        
      }
    }
    return records;
  };

  function initGreedyRefAccessors(){
    
    self.getNonGreedyRefs = function(){
      var ngRefs = [];
      for (var i = 0; i < self.sheets.refs.length; i++){
        if (!self.sheets.refs[i].greedy){
          ngRefs.push(self.sheets.refs[i]);
        }
      }
      return ngRefs;
    };
    
    self.getGreedyRefs = function(){
      var gRefs = [];
      for (var i = 0; i < self.sheets.refs.length; i++){
        if (self.sheets.refs[i].greedy){
          gRefs.push(self.sheets.refs[i]);
        }
      }
      return gRefs;
    };
 
  };

  //*UTILITY FUNCTIONS*//

  function cacheParams(p){
    Logger.log('running cacheParams()!')
    self.sheets = {paramCache: constructSheet(p.view.self + 'Params.' + p.view.name)};
    var range = [[p.refs[0].names, p.refs[1].names, p.dates.start, p.dates.end]];

    Logger.log('param range: ' + range);
    self.sheets.paramCache.clearRange();
    self.sheets.paramCache.setRange(range);
    Logger.log('Finished running cacheParams()!');
  };

  function getParamsFromCache(viewClass, view){
    Logger.log('running getParamsFromCache()!');
    var params = constructSheet(viewClass + 'Params.' + view);
    return {
      ref0Names: params.data[0].ref0names,
      ref1Names: params.data[0].ref1names,
      start: params.data[0].start,
      end: params.data[0].end
    };
  };

  function reconcileRefs (){
    for (var i = 0; i < self.sheets.refs.length; i++){
      reconcileRef(self.sheets.refs[i]);
    }
  };

  function reconcileRef(ref){
    var idKey = ref.idKey,
      oldNames = ref.names,
      newNames = [],
      ids = [];
    for (var i = 0; i < self.recordList.length; i++){
      ids.push(self.recordList[i][idKey]);
    }
    ref.ids = ids.dedupe();
    ref.names = getNamesFromIds(ref.model, ids);    
  };

  function isRef(attr){
    var isRef = false;
    for (var i = 0; i < self.sheets.refs.length; i++){
      if (attr == self.sheets.refs[i].nameKey){
        isRef = true;
      }
    }
    return isRef;
  };

  function getRefIndexFromClass(class){
    for (var i = 0; i < self.sheets.refs.length; i++) {
      if (self.sheets.refs[i].class == class){return i;}
    };
  };

  function getRecordsByRefId(ref, id){
    return self.getRecordsSortedByRef(ref)[id];
  };

  function getRecordFromId(id){
    for (var i = 0; i < self.recordList.length; i++) {
      if (self.recordList[i].id == id) {return self.recordList[i];} 
    };
  };


  function getRowFromRecordId(id){
    for (var i = 0; i < self.range.length; i++) {
      if (self.range[i][self.sheets.self.headers.indexOf('id')]){
        return i + 2;
      }
    };
  };

  function getGridRowColFromRecordId(id){
    for (var i = 0; i < self.cellmap.length; i++) {
      if (cellmap[i].recordid == id)
        return {row: cellmap[i].row, col: cellmap[i].col};
    };
  };


  function getAmFromPeriod(period){
    if(period.indexOf('AM') >= 0){
      return true;
    } else {
      return false;
    }
  };

  function getPmFromPeriod(period){
    if(period.indexOf('PM') >= 0){
      return true;
    } else {
      return false;
    }
  };

  function getPeriodFromAmPm(am, pm){
    if (am && pm) {
      return 'AM/PM';
    } else if (am){
      return 'AM';
    } else {
      return 'PM';
    }
  };

  function getCodeFromStatus(status){
    var codes = {
      unassigned: '-u',
      assigned: '-a',
      delegated: '-d',
      confirmed: '-c',
      cancelled: '-x',
      notfree: '-n'
    }
    return codes[status];
  };

  function getStatusFromCode(code){
    var statuses = {
      '-u': 'unassigned',
      '-a': 'assigned', 
      '-d': 'delegated',
      '-c': 'confirmed',
      '-x': 'cancelled',
      '-n': 'notfree'
    }
    return statuses[code];
  };



  function getErrorStr(errorArr){
    var str = '';
    for (var i = 0; i < errorArr.length; i++) {
      str.concat(errorArr[i] + '\n');
    };
    return str;
  };

  //** vvv INITIALIZE REFS vvv **///

  function initRefs(prefs) {
    Logger.log('Running initRefs()');
    var refs = [];
    
    for (var i = 0; i < prefs.length; i++){
      Logger.log('Initalizing ref for: ' + ref);
      self.sheets.refs[i] = {
        model: constructSheet(prefs[i].class + '.' + prefs[i].instance),
        class: prefs[i].class,
        nameKey: prefs[i].class.slice(0, -1),
        idKey: prefs[i].class.slice(0, -1) + 'id'
      };
    Logger.log('self.sheets.refs: ' +self.sheets.refs);
      if (self.view.init == 'fromRel'){
        initRefIdsFromRel(prefs, i);
      } else if (self.view.init == 'fromUi' || self.view.init == 'fromView'){//only initialize ref.names if initializing from ui (not available yet if initializing from self))
        var names = prefs[i].names.split(', '); 
      } else if (self.view.init = 'fromRange'){
        var names = self.sheets.paramCache.data[0]['ref' + i + 'names'];
      } 
      Logger.log('names: ' + names);
      initRefIdsFromNames(ref, names, i);
    }
    initGreedyRefAccessors();
    //initRefAccessors();

    if (self.errors.refs.length >= 0){
      toast(getErrorStr(self.errors.refs));
      Logger.log(getErrorStr(self.errors.refs);
    } 
    Logger.log('Completed initRefs()!');
  };

  function initRefIdsFromNames(ref, names, i){
    Logger.log('self.sheets.refs: ' +self.sheets.refs);
    Logger.log('self.sheets.refs[i].model: ' + self.sheets.refs[i].model);
    if (names == 'all'){//for param 'all', retrieve all active names and ids of entity type specified by ref
      self.sheets.refs[i].greedy = true;
      self.sheets.refs[i].ids = getActiveIdsFromModel(self.sheets.refs[i].model);
      self.sheets.refs[i].names = getActiveNamesFromModel(self.sheets.refs[i].model);//reset names from 'all' to list of all actual names in ref model
    } else {
      self.sheets.refs[i].greedy = false;
      self.sheets.refs[i].names = names;
      var result = getIdsFromNames(self.sheets.refs[i].model, names);//store result and check for errors
      if (result.error){//log any lookup errors
        self.errors['refs'][i] = 'ERROR: a list of ' + self.sheets.refs[i].nameKey + ' ids could not be retrieved because the user tried to search for a '+ self.sheets.refs[i].nameKey +'name that does not exist.';
      } else {//if no errors, add retrieved ids to the view object's ref object
        self.sheets.refs[i].ids = result;
      }
    }
  };

  function initRefNamesFromCache(ref){
    

  };

  function initRefIdsFromRel(){
    /*this.sheets.refs[0].ids = this.rel.sheets.refs[1].ids;
    this.sheets.refs[0].names = this.rel.sheets.refs[1].names;
    this.sheets.refs[1].ids = this.rel.sheets.refs[0].ids;
    this.sheets.refs[1].names = this.rel.sheets.refs[0].names;
  */
  };

  //** ^^^ INITIALIZE REFS ^^^ **///

  //** vvv INITIALIZE DATES vvv **//

  function initDatesFromParams(){
    return {
      start: self.p.dates.start.setToMidnight(),
      end: self.p.dates.end.setToMidnight(),
      weekMap: self.p.dates.start.getWeekMap()
    }
  };

  function initDatesFromCache(){
    return {
      start: self.sheets.paramCache.data[0].start,
      end: self.sheets.paramCache.data[0].end,
      weekMap: self.sheets.paramCache.data[0].start.getWeekMap()
    }
  };

  //** ^^^ INITIALIZE DATES ^^^ **//

  //** vvv INITIALIZE FILTERS vvv **//

  function initFilters(pfilters){
    if (self.errors.refs == undefined){//only proceed if no errors initializing refs
      var view = self.view.name;
      if (view == 'lookup'){//retroactively set params to include non-gredy refs if in lookup view
        pfilters.lookup.matchRefs.ngRefs = self.getNonGreedyRefs();
        var ngRefs = pfilters.lookup.matchRefs.ngRefs;
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

              for (var i=0; i<args.ngRefs.length; i++){
                var argRef = args.ngRefs[i];
                Logger.log('ref class:' + argRef.class);
                if (args.type == 'exclusive'){//filter if ids of *any* ref models don't match  
                  Logger.log('record id:' + record[argRef.idKey]);
                  if (argRef.ids.indexOf(record[argRef.idKey]) < 0){
                    filter = true;
                  }
                } else {//filter if ids of *all* ref models don't match
                  if (argRef.ids.indexOf(record[argRef.idKey]) >= 0){
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

  //** ^^^ INITIALIZE FILTERS ^^^ **//

  //** vvv INITIALIZE RECORD LIST vvv **//

  function initRecordListFromModel(){
    if (self.errors.refs == undefined){//only proceed if there were no errors initializing refs
      var recordList = [];
      for (var i = 0; i < self.sheets.model.data.length; i++){  
        var record = self.sheets.model.data[i];
        if (applyFilters(record)){//if a record matches filter criteria, skip it
          continue;
        } else {//if not, add it to record list
          recordList.push(record);
          Logger.log('Adding record!');
        }
      }
      Logger.log('completed initRecordListFromModel()!');
      for (var i = 0; i < recordList.length; i++) {
        for (var j in recordList[i]){
          Logger.log ('recordList['+i+']['+j+']: ' + recordList[i][j]);
        }
      };
      if (recordList.length > 0){
        return recordList;
      } else {
        self.errors['recordList'] = 'ERROR: there were no records retrieved for the specified reference ids.';
        toast(getErrorStr(self.errors.recordList));
        Logger.log(getErrorStr(self.errors.recordList));
      }      
    }      
  };

    function initRecordListFromSelf(){
    Logger.log('Running initRecordListFromSelf()');
    var recordList = [];
    if (self.view.type == 'list'){
      for (var i = 0; i < self.sheets.self.data.length; i++){
        if (self.sheets.self.data[i].id == undefined){//if no id is given (signifying a new record), populate record list row data from view row data
          var recordListRow = getRecordListRowFromViewRow(self.sheets.self.data[i]);
        } else {//otherwise, populate record list row from volatile data from view row and stable data from model
          var volatileData = getVDFromListRow(self.sheets.self.data[i]),
            recordListRow = getRecordListRowFromVD(volatileData);
        }
        recordList.push(recordListRow);
      }
    } else {//for grid 
      var map = self.sheets.cellmap;
      for (var i = 0; i < map.data.length; i++){
        var volatileData = getVDFromGridCell(map.data[i]),
          recordListRow = getRecordListRowFromVD(volatileData);
        recordList.push(recordListRow);
      }
    }
    for (var i = 0; i < recordList.length; i++) {
      Logger.log('recordList['+i+']: ');
      for (var j in recordList[i]){
        Logger.log('recordList['+i+']['+j+']: ' + recordList[i][j]);
      } 
    };
    return recordList;
  }; 

  function getRecordListRowFromViewRow(row) {
    var rlRow = {};

    //define rl start and end attributes from view row date, start, and end attributes
    rlRow.start = new Date(row.date);
    rlRow.end = rlRow.start;
    rlRow.start.setHours(row.start.getHours());
    rlRow.end.setHours(row.end.getHours());
    
    for (var attr in row){
      if (attr == 'day' || attr == 'date' || attr == 'start' || attr == 'end'){//skip view row attributes used to define rl start and end
        continue;
      } else if (attr == 'period'){//retrieve am & pm bool vals from period attr
        rlRow.am = getAmFromPeriod(row[attr]);
        rlRow.pm = getPmFromPeriod(row[attr]);
      } else if (isRef(attr)){//if view row attribute refers to a ref object, retrieve ref ids from ref name lookups
        rlRow[attr + 'id'] = getIdFromName(self.sheets.refs[attr+'s'].model, row[attr]);
      } else {//otherwise populate rl attributes with attributes from view row
        rlRow[attr] = row[attr] == undefined ? undefined : row[attr];
      }
    }
    return rlRow;
  };

  function getVDFromListRow(row){
    var vd = {id: row.id};
    for (var i = 0; i < self.volatiles.length; i++){
      var vol = self.volatiles[i];
      if (vol.indexOf('id') > 0){//if volatile is a ref id, look up ref id from ref name
        var nameKey = vol.slice(0, -2),
          index = getRefIndexFromClass(vol);
        vd[vol] = row[refKey] == undefined ? undefined : getIdFromName(self.sheets.refs[index].model, row[nameKey]); //ternary handles empty cells 
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
      refId = refName != '' ? getIdFromName(self.sheets.refs[1].model, refName) : undefined;
      idKey = self.sheets.refs[1].idKey;
      vd[idKey] = refId;

    return vd;
  };

  function getRecordListRowFromVD(vd){
    var id = vd.id, 
      row = {};

    for (var attr in vd){//retrieve all volatile values from vd{}
      row[attr] = vd[attr] == undefined ? '' : vd[attr];//translate undefined cell values to an empty string
    }
    for (var attr in self.sheets.model.data[id]){//retrieve all stable values (ie values not attributes of vd{}), from model
      if (!(attr in vd)){
        row[attr] = self.sheets.model.data[id][attr];  
      }
    }
    return row;
  };

  function applyFilters(record){//cycle through all filter functions and return true if any of them return true
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

  //** ^^^ INITIALIZE RECORD LIST ^^^ **//

  //** vvv INITIALIZE GRID MAP vvv **//

  function initGridMap(){
    Logger.log('Running initGridMap()!');
    var names = self.sheets.refs[0].names.sort(),
      gridMap = [];
    for (var i = 0; i < names.length; i++){
      gridMap.push({
        name: names[i],
        info: {
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
        }
      });      
    }
    initGridMapRecordIds(gridMap);
    Logger.log('finished running initGridMap()!');
    return gridMap;
  };

  function initGridMapRecordIds(gridMap){
    Logger.log('running initGridRecordIds()');
    for (var i = 0; i < gridMap.length; i++){
      for (var day in gridMap[i].info){
        for (var period in gridMap[i].info[day]){
          gridMap[i].info[day][period].recordIds = initRecordIdsForGridCell(gridMap, i, day, period);
        }
      }
    }
    Logger.log('finished running initGridRecordIds()!'); 
  };

  function initRecordIdsForGridCell(gridMap, index, day, period){

    var am = (period == 'am') ? true : false,
      pm = !am,
      date = self.dates.weekMap[day],
      idKey = self.sheets.refs[0].idKey,
      id = getIdFromName(self.sheets.refs[0].model, gridMap[index].name),
      ids= [];

    for (var i = 0; i < self.recordList.length; i++){
      var record = self.recordList[i];
      if (
        record[idKey] == id &&
        record.am == am && 
        record.pm == pm && 
        record.start.getYear() == date.getYear() &&
        record.start.getMonth() == date.getMonth() &&
        record.start.getDate() == date.getDate()
      ) {
        ids.push(record.id);
      }
    }
    Logger.log('finished running getGridCellRecordIds()')
    Logger.log('ids: ' + ids);
    return ids;
  };

  //** ^^ INITIALIZE GRID MAP ^^ **//

  //** vvv INITIALIZE RANGE vvv **//
  function initRange(){
    Logger.log('Running initRange()!')
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
        range[i].push(initListRangeCellVal(self.recordList[i], headers[j]));
      }
    }
    return range;
  };

  function initListRangeCellVal(record, header){
    if (header in record){//if the data type in the record list matches the data type specified by the header, return the value without formatting
      return record[header];
    } else if (header+'s' in self.sheets.refs){//if the header refers to a ref name, return the name corresponding to the ref id      
      return (record[header+'id'] == undefined || record[header+'id'] == '') ? '' : getNameFromId(self.sheets.refs[header+'s'].model, record[header+'id']);
    } else {//otherwise format the value according to the following patterns
      var headers = {
        day: record.start.getDayName(),
        date: record.start.getFormattedDate(),
        start: record.start.getFormattedTime(),
        end: record.end.getFormattedTime(),
        period: getPeriodFromAmPm(record.am, record.pm)
      }
      return headers[header];
    }
  };

  function initGridRange(){
    Logger.log('running initGridRange()!');
    var range = [];
    for (var i = 0; i < self..gridMap.length; i ++){
      range.push(initGridRangeRow(i));
    }
    return range;  
  };

  function initGridRangeRow(i){
    var row = [];
    row[0] = self..gridMap[i].name;
    for (var day in self..gridMap[i].info){
      for (var period in self..gridMap[i].info[day]){
        row.push(initGridRangeCellVals(self..gridMap[i].info[day][period].recordIds));
      }
    }
    return row;
  };

  function initGridRangeCellVals(recordIds){
    Logger.log('Running getGridCellValsFromRecordIds()!');
    var cell = [];
    Logger.log('recordIds: ' + recordIds);
    for (var i = 0; i < recordIds.length; i++){
      var record = getRecordFromId(recordIds[i]);
      for (var j in record){
        Logger.log('record['+j+']: ' + record[i]);
      }
      Logger.log('record[self.sheets.refs[1].idKey]: ' + record[self.sheets.refs[1].idKey]);
      Logger.log('recordIds['+i+']: ' + recordIds[i]);
      Logger.log('record: ' + record);
      Logger.log('idKey: ' + self.sheets.refs[1].idKey);
      //Logger.log('refName: ' + record[self.sheets.refs[1].idKey] == undefined ? '' : getNameFromId(self.sheets.refs[1].model, record[self.sheets.refs[1].idKey]));
      Logger.log('status: ' + getCodeFromStatus(record.status));
      //var record = getRecordFromId(recordIds[i]),
      var idKey = self.sheets.refs[1].idKey,
        refName = record[idKey] == undefined ? '' : getNameFromId(self.sheets.refs[1].model, record[idKey]),
        status = getCodeFromStatus(record.status);
      cell.push(refName + ' ' + status);
    }
    cell = cell.join(', ');
    Logger.log('Finished running getGridCellValsFromRecordIds()!');    
    Logger.log('cell: ' + cell);
    return cell;
  };




  //** ^^ INITIALIZE RANGE ^^ **//
};

///// ^^^ VIEW CONSTRUCTOR FUNCTION ^^^ //////


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

