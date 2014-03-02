/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

//MASTER!

//*CONSTRUCT SHEET OBJECTS

function constructSheet(ss, ws){
  // Logger.log('ss: ' + ss);
  // Logger.log('ws: ' + ws);
  var sheets = {
        riders: {
          key: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
          worksheets: ['info', 'assignments', 'metrics']
        },
        restaurants: {
          key: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
          worksheets: ['info', 'needs', 'metrics']
        },
        shifts: {
          key: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
          worksheets: ['index']
        },
        availabilities: {
          key: '0AkfgEUsp5QrAdEdvSWQ0eVRMZmR1RXZRRW13LWY0ZEE',
          worksheets: ['index']
        },
        schedule: {
          key: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
          worksheets: ['grid', 'weekly', 'update', 'lookup']
        },
        scheduleParams: {
          key: '0AkfgEUsp5QrAdHp6Q2dES0Z5Tm9YOGZsSWRnUEFuX0E',
          worksheets: ['grid', 'weekly', 'update', 'lookup']
        },
        scheduleCellMaps: {
          key: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
          worksheets: ['grid', 'weekly', 'update', 'lookup']
        },
        availability: {
          key: '0AkfgEUsp5QrAdG54d2VpakNXZEFsS05yRjByQmxwbmc',
          worksheets: ['grid', 'weekly', 'lookup']
        },
        availabilityParams:{
          key: '0AkfgEUsp5QrAdHBqa2tkTXlwVnBoY0M5cmxrOUtRMVE',
          worksheets: ['grid', 'weekly','lookup']
        },
        availabilityCellMaps: {
          key: '0AkfgEUsp5QrAdHloc1pSM0YtQjBxdjV2Qktrdzd4bHc',
          worksheets: ['grid', 'weekly', 'lookup']
        }
      },
    sheet = new Sheet(sheets[ss].key, sheets[ss].worksheets.indexOf(ws));
    sheet.class = ss;
    sheet.instance = ws;
  return sheet;
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
    // Logger.log('.setRange range: ' + range);
    // Logger.log('range.length: ' + range.length);
    // Logger.log('typeof(this): ' + typeof(this));
    // Logger.log('typeof(range): ' + typeof(this));
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

//* vvv UTILITY FUNCTIONS vvv *//

function getSsName(){
  return SpreadsheetApp.getActiveSpreadsheet().getName();
};

function getWsName(){
  return SpreadsheetApp.getActiveSheet().getName();
};

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
  var error = 'ERROR: there was no ' + model.class.slice(0, -1) + ' found with name: ' + name;
  toast(error);
  Logger.log(error);
};

// function getRecordsFromModelByIds(model, ids){
//   for (var i = 0; i < ids.length; i++){
//     records.push(getRecordById(model, id));
//   }
//   return records;
// };

// function getRecordFromModelById(model, id){
//   return model.data[id];
// };

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


function getNamesFromIds(model, ids){
  var names = [];
  for (var i=0; i < ids.length; i++){
    names.push(getNameFromId(model, ids[i]));
  }
  return names;
};

function getNameFromId(model, id){
  // Logger.log('running getNamesFromId('+model.class +'.'+ model.instance +', '+id+')');
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

//* ^^^ UTILITY FUNCTIONS ^^^ *//


//*** VIEW CONSTRUCTOR FUNCTION ***//

function View(p){
  
  var self = this;//store reference to view's context
  if (p.view.init == 'fromUi'){cacheParams(p);}//cache params, store them as attribute
  this.p = p;
  this.errors = {};

  //*ATTRIBUTES*//

  this.view = p.view;
  this.view.type = this.view.instance == 'grid' ? 'grid' : 'list';
  this.view.sheet = constructSheet(this.view.class,  this.view.instance);
  //LOG VIEW PARAMS (for testing) 
  for (var j in this.view){
    Logger.log('this.view['+j+']: ' + this.view[j]);
  }

  this.model = p.model;
  this.model.sheet = constructSheet(this.model.class,  this.model.instance);

  this.cache = {
    params: {class: this.view.class+'Params', instance: this.view.instance, sheet: constructSheet(this.view.class+'Params', this.view.instance)},
    cellmap: {class: this.view.class+'CellMaps', instance: this.view.name, sheet: constructSheet(this.view.class+'CellMaps', this.view.instance)}
  };

  if (this.view.init =='fromRel'){this.rel = p.rel;}
  initDates();
  initRefs();    

  if (this.view.init == 'fromRange'){
    this.vols = p.vols[this.view.type];
  } else {
    this.filters = initFilters();
  }
  
  initRecordList();//array of objects: each object is a record to be displayed in the view
  initGridMap();//map of which record attributes correspond to which cell of a grid view
  initRange();//2d array mapping record list values to spreadsheet range in view instance

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
    this.view.sheet.clearRange();
    this.view.sheet.setRange(range);
    if (this.view.type == 'grid') {this.writeToCellMap();}
    return this;
  };

  this.writeToCellMap = function (){
    Logger.log('running this.writeToCellMap()');
    var gm = this.gridMap,
      id = 0,
      range =[];
    // Logger.log('gm: ' + gm);
    // Logger.log('gm.length: ' + gm.length);
  
    //build cellmap range from grid row data
    for (var i = 0; i < gm.length; i++){
      for (var day in gm[i].info){
        for (var period in gm[i].info[day]){
          // Logger.log('gm['+i+'].info['+day+']['+period+'].recordIds: ' + gm[i].info[day][period].recordIds)
          for (var j = 0; j < gm[i].info[day][period].recordIds.length; j++){
            range.push([
              id,//id
              i + 2,//row
              gm[i].info[day][period].col,//col
              j,//index 
              gm[i].info[day][period].recordIds[j]//recordid
            ]);
            id++;
          }
        }
      }
    } 
    this.cache.cellmap.sheet.clearRange();
    this.cache.cellmap.sheet.setRange(range);
    return this;
  };

  this.writeToModel = function(){
    Logger.log('Running '+ this.view.class +'.writeToModel()!')
    for (var i = 0; i < this.recordList.length; i++){//match record list rows to this.model.sheet rows by id
      var id = this.recordList[i].id;
      if (id == undefined || id == 'new'){//if the view's id attr indicates a new record, create one 
        this.writeNewRecordToModel(this.recordList[i], i);
      } else {//otherwise, overwrite all cells in this.model.sheet whose values don't match those in the record list
        for (var j = 0; j< this.vols.length; j++){
          var vol = this.vols[j];
          if (this.recordList[i][vol] != this.model.sheet.data[id][vol]){
            this.model.sheet.updateCell(this.model.sheet.getRowNum(id), this.model.sheet.getColNum(vol), this.recordList[i][vol]);
          }
        }        
      }
    }
    this.model.sheet = constructSheet(this.view.sheet.class, this.view.sheet.instance);//refresh view object's copy of model to reflect changes just written to it
    toast('Updated '+ this.model.sheet.g.getParent().getName() +' this.model.sheet!');
    Logger.log('Finished running '+ this.view.class +'.writeToModel()!')
    return this;
  };

  this.writeNewRecordToModel = function(record, i){
    // Logger.log('running .writeNewRecordToModel()');
    // for (var j in record){
    //   Logger.log ('record['+j+']: ' + record[j]);
    // }
    var range = [];
    record.id = this.model.sheet.g.getLastRow() -2 + 1;//set the new record's id to one greater than the last id in the model
    this.recordList[i].id = record.id;//append new id to record list
    this.range[i][0] = record.id;//append new id to range
    for (var j = 0; j < this.model.sheet.headers.length; j++){
      var val = record[this.model.sheet.headers[j]];
      if (val == undefined){//substitute empty string for undefined values
        range.push('');
      } else {
        range.push(val);        
      }
    }
    Logger.log('range: ' + range);
    this.model.sheet.g.appendRow(range);
    return this;
  };

  this.refreshViews = function(instances){
    Logger.log('Running .refreshViews()!');
    Logger.log('this.p: ' + this.p);
    for (var j in this.p){
      Logger.log('this.p['+j+']: ' + this.p[j]);
    }
    for (var i = 0; i < instances.length; i++) {
      var p = this.p,//retrieve core paramaters for view class from this view instance's paramaters 
        p2 = getParamsFromAltInstance(this.view.class, instances[i]);//retrieve paramaters for view instance to be refreshed

      p.refs[0].names = p2.ref0Names;//modify core params according to values stored for alt instance
      p.refs[1].names = p2.ref1Names;
      p.dates = {start: p2.start, end: p2.end};

      p.view.init = 'fromAltInstance';//add params specifying initialization from view (and view instance)
      p.view.instance = instances[i];
     
      var altView = new View(p);//construct view object for other view instance
      altView.writeToSelf();//call .writeToSelf() to refresh the view instance
      toast('Updated ' + this.view.class + ' ' + instances[i] + ' view!');
    }
    Logger.log('Finished running .refreshViews()!');
    return this;
  };


  this.getConflictsWith = function(View){
    Logger.log('running .getConflictsWith()');
    toast('Checking for conflicts...')
    var viewRl = this.getRecordsSortedByRef(this.refs[1]),
      relRl = View.getRecordsSortedByRef(View.refs[0]);
    getConflicts(viewRl, relRl);
    Logger.log('finished running .getConflictsWith()');    
    return this;
  };

  function getConflicts(viewRl, relRl){   
    Logger.log('running getConflicts()');
    self.conflicts = [];
    self.noConflicts = [];
    for (var refId in viewRl) {
      for (var i = 0; i < viewRl[refId].length; i++) {
        var r1 = viewRl[refId][i];
        for (var j = 0; j < relRl[refId].length; j++){
          if (viewRl[refId][i].start.getDate() == relRl[refId][j].start.getDate() && (viewRl[refId][i].am == relRl[refId][j].am || viewRl[refId][i].pm == relRl[refId][j].pm)){//match on day and period
            if (relRl[refId][j].status == 'not free'){
              Logger.log('found conflict.');
              self.conflicts.push({viewid: viewRl[refId][i].id, relid: relRl[refId][j].id});
            } else {
              self.noConflicts.push({viewid: viewRl[refId][i].id, relid: relRl[refId][j].id});
            }
          }
        }
      }
    }

    // //LOG CONFLICTS (for testing)
    for (var i = 0; i < self.conflicts.length; i++) {
      Logger.log('self.conflicts[i]: ' + self.conflicts[i]);
      for (var j in self.conflicts[i])
        Logger.log('self.conflicts['+i+']['+j+']: ' + self.conflicts[i][j]);
    };
    //LOG NOCONFLICTS (for testing)
    for (var i = 0; i < self.noConflicts.length; i++) {
      Logger.log('self.conflicts[i]: ' + self.conflicts[i]);
      for (var j in self.noConflicts[i])
        Logger.log('self.noConflicts['+i+']['+j+']: ' + self.noConflicts[i][j]);
    };    
    Logger.log('finished running getConflicts()');
  };

  this.showConflicts = function(){
    Logger.log('running .showConflicts()');
    if (this.conflicts.length > 0){
      toast('Conflicts found! Highlighted rows conflict with ' + this.refs[1].class + ' ' + this.rel.view.view.class);
      handleConflicts();
    } else {
      toast('No conflicts found!');
    }      
    handleNoConflicts();
    Logger.log('finished running .showConflicts()');
  };

  function handleConflicts(){
    for (var i = 0; i < self.conflicts.length; i++) {
      self.recordList[self.conflicts[i].viewid].status = 'not free';//set status in record list     
      if (self.view.type == 'list'){//reflect status in list row
        var statusCell = self.view.sheet.g.getRange(getRowFromRecordId(self.conflicts[i].viewid), self.view.sheet.headers.indexOf('status') + 1),//get range coordinates for cell showing record's status attr
          recordRow = self.view.sheet.g.getRange(getRowFromRecordId(self.conflicts[i].viewid), self.view.sheet.col.first, 1, self.view.sheet.col.getLast());//get range coordinates for row containing record
        statusCell.setValue('not free');//set value of cell containing status attribute to 'not free'
        recordRow.setBackground('#FF00FF');//set background of row containing record to hot pink
      } else if (self.view.type == 'grid'){//reflect status in grid cell
        var gc = getGridRowColFromRecordId(self.conflicts[i].viewid),//get row/col coordinates for gric cell containing record
          recordCell = self.view.sheet.g.getRange(gc.row, gc.col),//use r/c coordinates to identify cell's range location
          newVal = recordCell.getValue().slice(0,-2).concat('-n');//set value of code in range to '-' (corresponds to 'not free') 
        recordCell.setValue(newVal);
      }
    }    
  };

  function handleNoConflicts(){
    Logger.log('running handleNoConflicts()');
    Logger.log('self.noConflicts.length: ' + self.noConflicts.length);
    for (var i = 0; i < self.noConflicts.length; i++) {
      if (self.view.type == 'list'){//unhighlight noConflict rows that are still pink (because they used to contain a conflict)
        var recordRow = self.view.sheet.g.getRange(getRowFromRecordId(self.noConflicts[i].viewid), self.view.sheet.col.first, 1, self.view.sheet.col.getLast());
         if(recordRow.getBackground()== '#FF00FF'){
          recordRow.setBackground('#FFFFFF');
        }
      }
      self.getRecordFromId(self.noConflicts[i].viewid)[self.rel.join] = self.noConflicts[i].relid;//set the record's join id to the id of the corresponding record in the view's rel
      var viewJoinRange = self.model.sheet.g.getRange(self.model.sheet.getRowNum([self.noConflicts[i].viewid]), self.model.sheet.getColNum(self.rel.join));//only update join id in model if it is different from current join id val
      if (viewJoinRange.getValue()!= self.noConflicts[i].relid){viewJoinRange.setValue(self.noConflicts[i].relid);}
      // //LOG JOIN VALUES (for testing) 
      // Logger.log('self.getRecordFromId('+self.noConflicts[i].viewid+')['+self.rel.join+']: ' + self.getRecordFromId(self.noConflicts[i].viewid)[self.rel.join]);

      self.rel.view.getRecordFromId(self.noConflicts[i].relid)[self.rel.view.rel.join] = self.noConflicts[i].viewid;//set the join id of the corresponding record in the view's rel to the id of this record
      var relJoinRange = self.rel.view.model.sheet.g.getRange(self.rel.view.model.sheet.getRowNum([self.noConflicts[i].relid]), self.rel.view.model.sheet.getColNum(self.rel.view.rel.join));//only update join id in model if it is different from current join id val
      if (relJoinRange.getValue()!= self.noConflicts[i].viewid){relJoinRange.setValue(self.noConflicts[i].viewid);}      
      // // LOG JOIN VALUES (for testing)
      // Logger.log('self.rel.view.getRecordFromId('+self.noConflicts[i].relid+')['+self.rel.view.rel.join+']: ' + self.rel.view.getRecordFromId(self.noConflicts[i].relid)[self.rel.view.rel.join]);

    };
    Logger.log('finished running unhighlightNoConflicts()');
  };

  this.writeFromRel = function (){
    Logger.log('Running ' + this.view.class + '.writeFromRel()');
    var rel = this.rel.view;
    for (var i = 0; i < this.rel.view.recordList.length; i++) {//loop through foregin record list
      var viewid = this.rel.view.recordList[i][this.rel.view.rel.join],//write join ids to models
        relid = this.rel.view.recordList[i].id;
      if (viewid !== '' && viewid !== undefined){
        Logger.log('updating!');
        for (var j = 0; j < this.rel.vols.length; j++) {//loop through rel volatiles
          var vol = this.rel.vols[j];
          Logger.log('vol: ' + vol);
          if (this.getRecordFromId(viewid)[vol] != this.rel.view.recordList[i][vol]){//match on join id & compare vol values between rels, write from rel if values don't match
            this.model.sheet.updateCell(this.model.sheet.getRowNum(viewid), this.model.sheet.getColNum(vol), this.rel.view.recordList[i][vol]);
          }
        }
      }        
    }
    this.writeToSelf();
    this.model.sheet = constructSheet(this.view.sheet.class, this.view.sheet.instance);//refresh view object's copy of model to reflect changes just written to it
    toast('Updated ' + this.view.class + ' model from ' + this.rel.view.view.class + ' view.');//alert user
    Logger.log('Running ' + this.view.class + '.writeFromRel()');
    return this;
  };




  //**ACCESSOR METHODS **//

  function initRecordAccessors(){

    self.getRecordsSortedByRef = function (ref){
      Logger.log('running getRecordsSortedByRef('+ref.class+')');
      var records = {};
      // for (var j in ref){
      //   Logger.log('ref['+j+']: ' + ref[j]);
      // }
      Logger.log('ref.ids: ' + ref.ids);
      for (var i = 0; i < ref.ids.length; i++) {
        records[ref.ids[i]]=[];
        for (var j = 0; j < self.recordList.length; j++){
          if (self.recordList[j][ref.idKey] == ref.ids[i]){
            records[ref.ids[i]].push(self.recordList[j]);
          }        
        }
      }
      Logger.log('finished running getRecordsSortedByRef('+ref.class+')');
      for (var refId in records){
        for (var j=0; j<records[refId].length; j++){
          for (var k in records[refId][j]){
            Logger.log('records['+refId+']['+j+']['+k+']: ' + records[refId][j][k]);             
          }
        }
      }
      return records;
    };

    self.getRecordFromId = function(id){
      for (var i = 0; i < self.recordList.length; i++) {
        if (self.recordList[i].id == id) {return self.recordList[i];} 
      };
    };

  };

  function initRefAccessors(){
    
    self.getNonGreedyRefs = function(){
      var ngRefs = [];
      for (var i = 0; i < self.refs.length; i++){
        if (!self.refs[i].greedy){
          ngRefs.push(self.refs[i]);
        }
      }
      return ngRefs;
    };
    
    self.getGreedyRefs = function(){
      var gRefs = [];
      for (var i = 0; i < self.refs.length; i++){
        if (self.refs[i].greedy){
          gRefs.push(self.refs[i]);
        }
      }
      return gRefs;
    };
 
  };

  //*UTILITY FUNCTIONS*//

  function cacheParams(p){
    Logger.log('running cacheParams()!')
    // Logger.log('p.view.class: ' + p.view.class);
    // Logger.log('p.view.instance: ' + p.view.instance);
    self.cache = {params:{class: p.view.class, instance: p.view.instance, sheet: constructSheet(p.view.class+'Params', p.view.instance)}};
    var range = [[p.refs[0].names, p.refs[1].names, p.dates.start.setToMidnight(), p.dates.end.setToMidnight()]];

    self.cache.params.sheet.clearRange();
    self.cache.params.sheet.setRange(range);
    Logger.log('Finished running cacheParams()!');
  };

  function getParamsFromAltInstance(class, instance){
    Logger.log('running getParamsFromAltInstance()!');
    var params = constructSheet(class+'Params', instance).data[0];
    for (var j in params){
      Logger.log('params['+j+']: ' + params[j])
    }
    return {
      ref0Names: params.ref0names,
      ref1Names: params.ref1names,
      start: params.start,
      end: params.end
    };
  };

  function reconcileRefs (){
    Logger.log('running reconcileRefs()');
    for (var i = 0; i < self.refs.length; i++){
      reconcileRef(self.refs[i]);
    }
    Logger.log('finished running reconcileRefs()');
  };

  function reconcileRef(ref){
    Logger.log('running reconcileRef('+ref.class+')')
    if (self.recordList != undefined){
      var idKey = ref.idKey,
        oldNames = ref.names,
        newNames = [],
        ids = [];
      for (var i = 0; i < self.recordList.length; i++){
        if(
          self.recordList[i][idKey] != undefined && 
          self.recordList[i][idKey] != '' //&& 
          // typeof(self.recordList[i][idKey])=='number'
        ){
          ids.push(self.recordList[i][idKey]);
        }
      }
      ref.ids = ids.dedupe();
      Logger.log('ref.ids: ' + ref.ids);
      ref.names = getNamesFromIds(ref.sheet, ref.ids);  
    }
  };

  function isRef(attr){
    var isRef = false;
    for (var i = 0; i < self.refs.length; i++){
      if (attr.indexOf(self.refs[i].nameKey) >= 0){
        // Logger.log('attr: ' + attr);
        // Logger.log('nameKey: ' + self.refs[i].nameKey);
        isRef = true;
      }
    }
    return isRef;
  };

  function getRefIndexFromClass(class){
    for (var i = 0; i < self.refs.length; i++) {
      if (self.refs[i].class == class){return i;}
    };
  };

  function getRecordsByRefId(ref, id){
    return self.getRecordsSortedByRef(ref)[id];
  };

  function getRowFromRecordId(id){
    for (var i = 0; i < self.range.length; i++) {
      if (self.range[i][self.view.sheet.headers.indexOf('id')] == id){
        return i + 2;
      }
    };
  };

  function getGridRowColFromRecordId(id){
    for (var i = 0; i < self.cache.cellmap.sheet.data.length; i++) {
      if (self.cache.cellmap.sheet.data[i].recordid == id)
        return {row: self.cache.cellmap.sheet.data[i].row, col: self.cache.cellmap.sheet.data[i].col};
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
      free: '-f',
      'not free': '-n'
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
      '-f': 'free',
      '-n': 'not free'
    }
    return statuses[code];
  };


  function getErrorStr(errorArr){
    var str = '';
    for (var i = 0; i < errorArr.length; i++) {
      str.concat(errorArr[i] + '\n');
    }
    return str;
  };

  //** ^^^ UTILITY FUNCTIONS ^^^ **//

  //** vvv INITIALIZE DATES vvv **//

  function initDates(){
    switch (self.view.init){
      case 'fromUi':
        initDatesFromParams();
        break;
      case 'fromAltInstance':
        initDatesFromParams();
        break;
      case 'fromRange':
        initDatesFromCache();
        break;
      case 'fromRel':
        initDatesFromRel();
        break;
    }
  }

  function initDatesFromParams(){
    self.dates = {
      start: self.p.dates.start.setToMidnight(),
      end: self.p.dates.end.setToMidnight(),
      weekMap: self.p.dates.start.getWeekMap()
    }
  };

  function initDatesFromCache(){
    self.dates = {
      start: self.cache.params.sheet.data[0].start,
      end: self.cache.params.sheet.data[0].end,
      weekMap: self.cache.params.sheet.data[0].start.getWeekMap()
    }
  };

  function initDatesFromRel(){
    self.dates = self.rel.view.dates;
  };

  //** ^^^ INITIALIZE DATES ^^^ **//

  //** vvv INITIALIZE REFS vvv **///

  function initRefs() {
    Logger.log('Running initRefs()');
    self.refs = [];
    
    if (self.view.init == 'fromRel'){
      Logger.log('initializing refs from rel')
      self.refs[0] = self.rel.view.refs[1];
      Logger.log('initialized ref with class '+self.refs[0].class+' and instance ' + self.refs[0].instance);
      self.refs[1] = self.rel.view.refs[0];
      Logger.log('initialized ref with class '+self.refs[1].class+' and instance ' + self.refs[1].instance);
    } else {
      for (var i = 0; i < p.refs.length; i++){
        Logger.log('Initalizing ref for ref with class: ' + p.refs[i].class + ' and instance: ' + p.refs[i].instance);
        self.refs[i] = {
          class: p.refs[i].class,
          instance: p.refs[i].instance,
          sheet: constructSheet(p.refs[i].class, p.refs[i].instance),
          nameKey: p.refs[i].class.slice(0, -1),
          idKey: p.refs[i].class.slice(0, -1) + 'id'
        };
        if (self.view.init == 'fromUi' || self.view.init == 'fromAltInstance'){
          var names = p.refs[i].names.split(', '); 
        } else if (self.view.init = 'fromRange'){        
          var names = self.cache.params.sheet.data[0]['ref' + i + 'names'].split(', ');
        } 
        initRefIdsFromNames(names, i);        
      }      
    }
    initRefAccessors();
    //initRefAccessors();
    logRefErrors();
    Logger.log('Completed initRefs()!');
    // LOG REFS (for testing only)
    // for (var i = 0; i < self.refs.length; i++) {
    //   for (var j in self.refs){
    // Logger.log('self.refs['+i+']: ' + self.refs[i]);
    //   }  
    // };
  };

  function initRefIdsFromNames(names, i){
    if (names == 'all'){//for param 'all', retrieve all active names and ids of entity type specified by ref
      self.refs[i].greedy = true;
      self.refs[i].ids = getActiveIdsFromModel(self.refs[i].sheet);
      self.refs[i].names = getActiveNamesFromModel(self.refs[i].sheet);//reset names from 'all' to list of all actual names in ref model
    } else {
      self.refs[i].greedy = false;
      self.refs[i].names = names;
      var result = getIdsFromNames(self.refs[i].sheet, names);//store result and check for errors
      if (result.error){//log any lookup errors
        self.errors['refs'][i] = 'ERROR: a list of ' + self.refs[i].nameKey + ' ids could not be retrieved because the user tried to search for a '+ self.refs[i].nameKey +'name that does not exist.';
      } else {//if no errors, add retrieved ids to the view object's ref object
        self.refs[i].ids = result;
      }
    }
  };

  function logRefErrors(){
    if (self.errors.refs != undefined){
      toast(getErrorStr(self.errors.refs));
      Logger.log(getErrorStr(self.errors.refs));
    }     
  }

  //** ^^^ INITIALIZE REFS ^^^ **///



  //** vvv INITIALIZE FILTERS vvv **//

  function initFilters(pfilters){
    if (self.errors.refs == undefined){//only proceed if no errors initializing refs
      var view = self.view.instance;
        filterArr = [],//empty array to store filtering functions
        filterParams = {//map of filter params corresponding to view instances
          update:{matchAttrs: {attr: 'status', values: ['unassigned', 'assigned', 'delegated']}},
          lookup: {matchRefs: {type: 'exclusive', ngRefs: self.getNonGreedyRefs()}}
        },
        filters = {//filter functions
          date: {// if a record's start time is before or after the start and end in params, filter it
            args: {start: self.dates.start, end: self.dates.end},
            func: function(record, args){
              return (record.start.getTime() < args.start.getTime() || record.start.getTime() > args.end.getTime() + 86400000);
            }       
          },
          matchAttrs: {//if a record attribute doesn't match the values for that attribute specified in params, filter it
            args: {attr: undefined, values: undefined},
            func: function(record, args){
              if (args.values.indexOf(record[args.attr]) < 0){
                return true;
              } else {
                return false;
              }
            }
          },
          matchRefs: {//if a record's ref ids doesn't match view's active ref id's, filter it
            args: {type: undefined, ngRefs: undefined},
            func: function(record, args){
              //Logger.log('**Running matchRefs');
              var filter = args.type == 'exclusive' ? false : true; //default to not filter in exclusive search to filter in inclusive
              //Logger.log('init filter val: ' + filter);
              //Logger.log('args.type: ' + args.type);
              //Logger.log('args.ngRefs: ' + args.ngRefs);

              for (var i=0; i<args.ngRefs.length; i++){
                var argRef = args.ngRefs[i];
                // Logger.log('ref class:' + argRef.class);
                if (args.type == 'exclusive'){//filter if ids of *any* ref models don't match  
                  // Logger.log('record id:' + record[argRef.idKey]);
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
      for (var filter in filterParams[view]){//loop through filters corresponding to view given in params
        for (var arg in filterParams[view][filter]){//loop through each fitler's args as given in params 
          // Logger.log('pfilters['+view+']['+filter+']['+arg+']: ' + pfilters[view][filter][arg]);
          if (arg in filters[filter].args){//find arg names in filter that match arg names in params 
          // Logger.log('pfilters['+view+']['+filter+']['+arg+']: ' + pfilters[view][filter][arg]);
            filters[filter].args[arg] = filterParams[view][filter][arg];//initialize filter arguments to values of corresponding args in params  
          }
        }
        filterArr.push(filters[filter]); //add initialized filter to filters array
      }
      // Logger.log('Completed initFilters()!')
      // Logger.log('filterArr.length: ' + filterArr.length);
      // Logger.log('filterArr.contents: ');
      // for (var i = 0; i < filterArr.length; i++) {
      //   Logger.log('filterArr['+i+'].func: ' + filterArr[i].func);
      // };
      return filterArr;
    }
  };

  //** ^^^ INITIALIZE FILTERS ^^^ **//

  //** vvv INITIALIZE RECORD LIST vvv **//

  function initRecordList(){
    if (self.errors.refs == undefined){//only proceed if there were no errors initializing refs
      Logger.log('starting initRecordList()!');
      self.recordList = [];
      if (self.view.init == 'fromUi' || self.view.init == 'fromAltInstance' || self.view.init == 'fromRel'){
        initRecordListFromModel();        
      } else if (self.view.init == 'fromRange'){
        initRecordListFromSelf();
      }
      if (self.recordList.length > 0){
        reconcileRefs();
        initRecordAccessors();
        Logger.log('Completed initRecordList!');
      } else {
        logRecordListErrors();
      }
      // // LOG RECORD LIST (for testing only)
      // for (var i = 0; i < self.recordList.length; i++) {//log record list values
      //   for (var j in self.recordList[i]){
      //     Logger.log ('recordList['+i+']['+j+']: ' + self.recordList[i][j]);
      //   }
      // };
    }
  };

  function initRecordListFromModel(){
    for (var i = 0; i < self.model.sheet.data.length; i++){  
      if (!applyFilters(self.model.sheet.data[i])){//if a record matches filter criteria, skip it, if not, add it to the record list
        self.recordList.push(self.model.sheet.data[i]);
      }
    }    
  };

  function initRecordListFromSelf(){
    if (self.view.type == 'list'){
      for (var i = 0; i < self.view.sheet.data.length; i++){
        if (self.view.sheet.data[i].id == undefined){//if no id is given (signifying a new record), populate record list row data from view row data
          var recordListRow = getRecordListRowFromViewRow(self.view.sheet.data[i]);
        } else {//otherwise, populate record list row from volatile data from view row and stable data from model
          var volatileData = getVDFromListRow(self.view.sheet.data[i]),
            recordListRow = getRecordListRowFromVD(volatileData);
        }
        self.recordList.push(recordListRow);
      }
    } else {//for grid 
      var map = self.cache.cellmap.sheet;
      for (var i = 0; i < map.data.length; i++){
        var volatileData = getVDFromGridCell(map.data[i]),
          recordListRow = getRecordListRowFromVD(volatileData);
        self.recordList.push(recordListRow);
      }
    }
  }; 

  function getRecordListRowFromViewRow(row) {
    var rlRow = {};
    //define rl start and end attributes from view row date, start, and end attributes
    rlRow.start = new Date(row.date);
    rlRow.end = new Date(row.date);
    rlRow.start.setHours(row.start.getHours());
    rlRow.end.setHours(row.end.getHours());

    for (var attr in row){
      if (attr == 'day' || attr == 'date' || attr == 'start' || attr == 'end'){//skip view row attributes used to define rl start and end
        continue;
      } else if (attr == 'period'){//retrieve am & pm bool vals from period attr
        rlRow.am = getAmFromPeriod(row[attr]);
        rlRow.pm = getPmFromPeriod(row[attr]);
      } else if (isRef(attr)){//if view row attribute refers to a ref object, retrieve ref ids from ref name lookups
        rlRow[attr + 'id'] = getIdFromName(self.refs[getRefIndexFromClass(attr+'s')].sheet, row[attr]);
      } else {//otherwise populate rl attributes with attributes from view row
        rlRow[attr] = row[attr] == undefined ? undefined : row[attr];
      }
    }
    return rlRow;
  };

  function getVDFromListRow(row){
    var vd = {id: row.id};
    for (var i = 0; i < self.vols.length; i++){
      var vol = self.vols[i];
      if (vol.indexOf('id') > 0){//if volatile is a ref id, look up ref id from ref name
        var nameKey = vol.slice(0, -2),
          class = nameKey+'s',
          index = getRefIndexFromClass(class);
        vd[vol] = row[nameKey] == undefined ? undefined : getIdFromName(self.refs[index].sheet, row[nameKey]); //ternary handles empty cells 
      } else {
        vd[vol] = row[vol];
      }
    }
    return vd;
  };

  function getVDFromGridCell(m){
    var cell = self.view.sheet.data[m.row - self.view.sheet.row.first][self.view.sheet.headers[m.col - self.view.sheet.col.first]].split(', '),
      str = cell[m.index],
      refName = str.slice(0, str.indexOf('-')).trim(),
      code = str.slice(str.indexOf('-'), str.length).trim(),
      vd = {
        id: m.recordid,
        status: getStatusFromCode(code)
      },
      refId = refName != '' ? getIdFromName(self.refs[1].sheet, refName) : undefined,
      idKey = self.refs[1].idKey;
    vd[idKey] = refId;

    return vd;
  };

  function getRecordListRowFromVD(vd){
    var id = vd.id, 
      row = {};

    for (var attr in vd){//retrieve all volatile values from vd{}
      row[attr] = vd[attr] == undefined ? '' : vd[attr];//translate undefined cell values to an empty string
    }
    for (var attr in self.model.sheet.data[id]){//retrieve all stable values (ie values not attributes of vd{}), from model
      if (!(attr in vd)){
        row[attr] = self.model.sheet.data[id][attr];  
      }
    }
    return row;
  };

  function applyFilters(record){//cycle through all filter functions and return true if any of them return true
    //Logger.log('Running apply filters on record w/ id: ' + record.id);
    //Logger.log('self.filters.length: ' + self.filters.length);
    for (var i = 0; i < self.filters.length; i ++){
      //Logger.log('Running filter w/ index: ' + i);
      //Logger.log('result of filter: ' + self.filters[i].func(record, self.filters[i].args));
      if (self.filters[i].func(record, self.filters[i].args)){//if any filter returns true, return true
        return true;
      } 
    }
    return false;//if no filters return true, return false
  };

  function logRecordListErrors(){
    self.errors['recordList'] = 'ERROR: there were no records retrieved for the specified reference ids.';
    toast(getErrorStr(self.errors.recordList));
    Logger.log(getErrorStr(self.errors.recordList));
  };

  //** ^^^ INITIALIZE RECORD LIST ^^^ **//

  //** vvv INITIALIZE GRID MAP vvv **//

  function initGridMap(){
    if(self.errors.recordList == undefined){
      Logger.log('Running initGridMap()!');
      var names = self.refs[0].names.sort();
      self.gridMap = [];
      // Logger.log('names: ' + names);
      for (var i = 0; i < names.length; i++){
        self.gridMap.push({
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
      initGridMapRecordIds();
      Logger.log('finished running initGridMap()!');
    }
  };

  function initGridMapRecordIds(){
    Logger.log('running initGridMapRecordIds()');
    for (var i = 0; i < self.gridMap.length; i++){
      for (var day in self.gridMap[i].info){
        for (var period in self.gridMap[i].info[day]){
          self.gridMap[i].info[day][period].recordIds = initRecordIdsForGridCell(i, day, period);
        }
      }
    }
    Logger.log('finished running initGridRecordIds()!'); 
  };

  function initRecordIdsForGridCell(index, day, period){

    var am = (period == 'am') ? true : false,
      pm = !am,
      date = self.dates.weekMap[day],
      idKey = self.refs[0].idKey,
      id = getIdFromName(self.refs[0].sheet, self.gridMap[index].name),
      ids= [];
      // Logger.log('date: ' + date);
      // Logger.log('id:' + id);
      // Logger.log('idKey: ' + idKey);

    for (var i = 0; i < self.recordList.length; i++){
      // Logger.log('self.recordList['+i+']['+idKey+']: ' + self.recordList[i][idKey]);
      // Logger.log('self.recordList['+i+'].start: ' + self.recordList[i].start);
      if (
        self.recordList[i][idKey] == id &&
        self.recordList[i].am == am && 
        self.recordList[i].pm == pm && 
        self.recordList[i].start.getYear() == date.getYear() &&
        self.recordList[i].start.getMonth() == date.getMonth() &&
        self.recordList[i].start.getDate() == date.getDate()
      ) {
        // Logger.log('added ' + self.recordList['+i+'].id + ' to gridMap.');
        ids.push(self.recordList[i].id);
      }
    }
    return ids;
  };

  //** ^^ INITIALIZE GRID MAP ^^ **//

  //** vvv INITIALIZE RANGE vvv **//
  function initRange(){
    Logger.log('Running initRange()!')
    if (self.errors.recordList == undefined){//only proceed if there were no errors retrieving record list
      self.range = [];
      if (self.view.type == 'list'){
        return initListRange();
      } else {
        return initGridRange();
      }      
    }
    Logger.log('Finished running initRange()!');
  };

  function initListRange(){
    var headers = self.view.sheet.headers;
    for (var i = 0; i < self.recordList.length; i++)  {
      self.range[i] = [];
      for (var j = 0; j < headers.length; j++){
        self.range[i].push(initListRangeCellVal(self.recordList[i], headers[j]));
      }
    }
  };

  function initListRangeCellVal(record, header){
    if (header in record){//if the data type in the record list matches the data type specified by the header, return the value without formatting
      return record[header];
    } else if (isRef(header)){//if the header refers to a ref name, return the name corresponding to the ref id     
      var idKey = header + 'id',
        class = header + 's';
      return (record[idKey] == undefined || record[idKey] == '') ? '' : getNameFromId(self.refs[getRefIndexFromClass(class)].sheet, record[idKey]);
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
    for (var i = 0; i < self.gridMap.length; i ++){
      self.range.push(initGridRangeRow(i));
    }
  };

  function initGridRangeRow(i){
    var row = [];
    row[0] = self.gridMap[i].name;
    for (var day in self.gridMap[i].info){
      for (var period in self.gridMap[i].info[day]){
        row.push(initGridRangeCellVals(self.gridMap[i].info[day][period].recordIds));
      }
    }
    return row;
  };

  function initGridRangeCellVals(recordIds){
    // Logger.log('Running initGridRangeCellVals()!');
    var cell = [];
    // Logger.log('recordIds: ' + recordIds);
    for (var i = 0; i < recordIds.length; i++){
      var record = self.getRecordFromId(recordIds[i]);
      // for (var j in record){
      //   Logger.log('record['+j+']: ' + record[j]);
      // }
      // Logger.log('record[self.refs[1].idKey]: ' + record[self.refs[1].idKey]);
      // Logger.log('recordIds['+i+']: ' + recordIds[i]);
      // Logger.log('record: ' + record);
      // Logger.log('idKey: ' + self.refs[1].idKey);
      // //Logger.log('refName: ' + record[self.refs[1].idKey] == undefined ? '' : getNameFromId(self.refs[1].sheet, record[self.refs[1].idKey]));
      // Logger.log('status: ' + getCodeFromStatus(record.status));
      var idKey = self.refs[1].idKey,
        refName = (record[idKey] == undefined || record[idKey] == '')? '' : getNameFromId(self.refs[1].sheet, record[idKey]),
        status = getCodeFromStatus(record.status);
      cell.push(refName + ' ' + status);
    }
    cell = cell.join(', ');
    // Logger.log('Finished running initGridRangeCellVals()!');    
    // Logger.log('cell: ' + cell);
    return cell;
  };

  //** ^^ INITIALIZE RANGE ^^ **//

};

//* ^^^ VIEW CONSTRUCTOR FUNCTION ^^^ *//


//* vvv CALENDAR FUNCTIONS vvv *//

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
      // Logger.log('restId: ' + restId);
      // Logger.log('eventId:' + eventId);
      // Logger.log('statusCode: ' + statusCode);
    //check to see if calendar events exist for all shifts
   if (eventId !== '' && eventId !== 'undefined' && eventId !== undefined){
      //if a event exists, update it
      // Logger.log('updating the event with eventId' + eventId);
      getEventById(calendars, restId, eventId).setTitle(statusCode);
   } else {
      //if not, create one
      // Logger.log('creating an event for the shift with shiftId: ' + shift.id);
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
    //if in a list view, update eventid column
    var instance = SpreadsheetApp.getActiveSheet().getName()
    if (instance != 'grid'){
      var schedule = constructSheet(self.view.class, view);
      schedule.updateCell(schedule.getRowNum(shiftId))
    }
    shifts.updateCell(shifts.getRowNum(shiftId), shifts.getColNum('eventid'), eventId);
  };

  function getStatusCode(riders, riderid, status){
    // Logger.log('running getStatusCode()');
    // Logger.log('riderid: ' + riderid);
    // Logger.log('riderid.length > 0 ? : ' + riderid != '');
    var rider = riderid != '' ? getNameFromId(riders, riderid) : '';
    // Logger.log ('rider: ' + rider);
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

//* ^^^ CALENDAR FUNCTIONS ^^^ *//

//*** vvv CALLING FUNCTIONS vvv ***//

function createMenus() {//creates event triggers for calling functions
    var menuEntries = [
      {        
        name: "Refresh View",
          functionName: "initRefreshViewUi" 
      },{
          name: "Save Edits",
          functionName: "saveEdits" 
      }
    ];
    SpreadsheetApp.getActiveSpreadsheet().addMenu("Functions", menuEntries);
};

function initRefreshViewUi(){//initiate UI dialog

  //get sheet and sheet index to determine view to pass to click handler
  var ss = SpreadsheetApp.getActiveSpreadsheet().getName(),
    ws = SpreadsheetApp.getActiveSheet().getName(),
    sheet = constructSheet(ss, ws),
  //retrieve view's current start and end dates from sheet data
    curStart = new Date().getWeekStart(),
    curEnd = curStart.incrementDate(6);
    
  //construct ui app
  var app = UiApp.createApplication().setTitle('Update Schedule View').setWidth(200),
    //construct panel to hold user input elements
    panel = app.createVerticalPanel(),
    //construct ui elements to retrive and store paramaters to pass to updateShiftsView()
    class = app.createHidden('class', ss).setName('class').setId('class'),
    instance = app.createHidden('instance', ws).setName('instance').setId('instance'),//store sheet name as 'view'
    startLabel = app.createLabel('Start Date').setId('startLabel'),
    start = app.createDateBox().setName('start').setId('start').setValue(curStart),
    endLabel = app.createLabel('End Date').setId('endLabel'),
    end = app.createDateBox().setName('end').setId('end').setValue(curEnd),
    //define callback
    submitHandler = app.createServerHandler('refreshView')
      .setId('submitHandler')
      .addCallbackElement(class)
      .addCallbackElement(instance)
      .addCallbackElement(start)
      .addCallbackElement(end);
  Logger.log('instance: ' + instance);
  //for lookup view, retrieve restaurants and riders from user input 
  if (ws == 'lookup'){
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
  if (ws == 'lookup'){
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

function refreshView(e){

//initialize uiApp instance and parameters for shift View object
var app = UiApp.getActiveApplication(),//open ui instance
  p = e.parameter,//store ui params
  params = {//initialize view params from ui params
    view: {class: p.class, instance: p.instance, init: 'fromUi'},
    model: {class: 'shifts', instance: 'index'},
    refs: [{class: 'restaurants', instance: 'info', names: p.restaurants}, {class: 'riders', instance:'info', names: p.riders}],
    dates:{start: p.start, end: p.end}
  };
  
  schedule = new View(params);//initialize schedule view
  schedule.writeToSelf();//write from schedule view to shifts model ss
  return app.close();  //close ui
};

function saveEdits(){

  var schedule = new View({
      view: {class: 'schedule', instance: getWsName(), init: 'fromRange'},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance:'info'}],
      vols: {grid: ['riderid', 'status', 'availabilityid'], list: ['riderid', 'status', 'billing', 'urgency', 'availabilityid']},
    }),
    availability = new View({
      view: {class: 'availability', instance: 'weekly', init: 'fromRel'},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance: 'info'}, {class: 'restaurants', instance: 'info'}],//maybe not necess?
      dates: {start: schedule.dates.start, end: schedule.dates.end},
      rel: {view: schedule, join: 'shiftid', vols: ['status', 'restaurantid', 'start', 'end']}
    });
  
  schedule.rel = {view: availability, join: 'availabilityid', vols: ['status', 'riderid']};
  schedule.getConflictsWith(availability).showConflicts();

  if (schedule.conflicts.length <= 0){
    availability
      .writeFromRel(schedule)
      .refreshViews(['grid', 'weekly', 'lookup']);
    schedule
      .writeToSelf()
      .refreshViews(['grid', 'weekly', 'update', 'lookup']);
      // .sendEmails();
      // .writeToCalendar();    
  }

};

//*** ^^^ CALLING FUNCTIONS ^^^ ***//
