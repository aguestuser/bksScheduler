// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//*CONSTRUCT SHEET OBJECTS
function Sheet (ss, ws){
  var self = this,
    testingKeys = {
      sheets: '0AkfgEUsp5QrAdFVXX0JMSjFIYWxXdlBZQ1NtRFVHVEE',
      riders: '0AkfgEUsp5QrAdE9qTFg3bVlCTWY1WHc2WDJ4QUpFU2c',
      restaurants: '0AkfgEUsp5QrAdFZ2RldES0l6ZDJCY0NTaFFtZFh6Znc',
      shifts: '0AkfgEUsp5QrAdHJMNWRVNkl0MmpRWEgzUk01NWtYNFE',
      availabilities: '0AkfgEUsp5QrAdGR2UXVyNGNlUGtFLUc0Qmd1MU10bFE',
      schedule: '0AkfgEUsp5QrAdEl2SUxRZWllQjFscW5kS3hIcE1JY3c',
      scheduleParams: '0AkfgEUsp5QrAdDZKY3VsZGJPOWR5TmE2Z2phbWZLM1E',
      scheduleGridMaps: '0AkfgEUsp5QrAdEp2T0dmTGdncERNNEFXbUtNeDFENGc',
      availability: '0AkfgEUsp5QrAdGMxekRkcUhKajBEX3Y5QmZtdFc0QkE',
      availabilityParams: '0AkfgEUsp5QrAdHpQUUl2Y2dUcy1Ma3V5cGRMM1E5bUE',
      availabilityGridMaps: '0AkfgEUsp5QrAdDVGMUQyY2w1bmdVX2VvdnM2dDhwY3c',
      emailElements: '0AkfgEUsp5QrAdElMUmVsRjJiOFNFcFV2ZzRUOXhWZ2c'
    },
    liveKeys = {
      sheets: '0AkfgEUsp5QrAdEI1T09ZUDFDY1Y2bE1xNzFyZTRnNnc',
      riders: '0AkfgEUsp5QrAdEt2eU9PcWhKbGVoUzlOS2RkU2RxMEE',
      restaurants: '0AkfgEUsp5QrAdFJyOW9RMjk5M2FNMXI4bmJBMzMwWFE',
      shifts: '0AkfgEUsp5QrAdEdJc3BmMEt0TXFTdmVHY1cyWHdMTFE',
      availabilities: '0AkfgEUsp5QrAdEdvSWQ0eVRMZmR1RXZRRW13LWY0ZEE',
      schedule: '0AkfgEUsp5QrAdGhXTFBiQVJLZ3hjNWpla19FYVVZdFE',
      scheduleParams: '0AkfgEUsp5QrAdHp6Q2dES0Z5Tm9YOGZsSWRnUEFuX0E',
      scheduleGridMaps: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
      availability: '0AkfgEUsp5QrAdG54d2VpakNXZEFsS05yRjByQmxwbmc',
      availabilityParams: '0AkfgEUsp5QrAdHBqa2tkTXlwVnBoY0M5cmxrOUtRMVE',
      availabilityGridMaps: '0AkfgEUsp5QrAdHloc1pSM0YtQjBxdjV2Qktrdzd4bHc',
      emailElements: '0AkfgEUsp5QrAdDBqR1VRNVJzZ3RPTU5jNGNPUkJYY1E'
    },
    key = testingKeys[ss];

  // function getKey(ss){
  //   //**vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
  //   // var sheets = SpreadsheetApp.openById('0AkfgEUsp5QrAdEI1T09ZUDFDY1Y2bE1xNzFyZTRnNnc').getSheetByName('index'),//<<---LIVE edit this key to match key for join table containing ss names & keys for project
  //   var sheets = SpreadsheetApp.openById('0AkfgEUsp5QrAdFVXX0JMSjFIYWxXdlBZQ1NtRFVHVEE').getSheetByName('index'),//<<---TESTING
  //   //**^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //     keys = getRowsData(sheets, sheets.getRange(2, 1, sheets.getLastRow(), 2));
  //   for (var i = 0; i < keys.length; i++) {
  //     if (keys[i].ss == ss) {
  //       return keys[i].key;
  //     }
  //   }
  // };

  //ATTRIBUTES
  this.g = SpreadsheetApp.openById(key).getSheetByName(ws);//g. accesses google spreadsheetApp's Sheet object for the sheet
  this.class = ss;
  this.instance = ws;//naming convention: each sheet has class ss name, instance sheet/tab name
  
  this.col = {//offset row/col picker for UI if the sheet in question is the schedule, otherwise set R,C of first cell to 2,1
    first: 1,
    getLast: function(){return self.g.getLastColumn()},
    getNum: function(){return self.g.getLastColumn()}
  };
  this.row = {
    first: 2,
    getLast: function(){return self.g.getLastRow()},
    getNum: function(){return self.g.getLastRow() - 2 + 1}
  };

  this.data = getRowsData(this.g, this.g.getRange(this.row.first, this.col.first, this.row.getLast(), this.col.getLast()), 1);//translate row data to JSON (see script below)
  this.headers = normalizeHeaders(this.g.getRange(1, 1, 1, this.col.getLast()).getValues()[0]);//create array of header names

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
        return (i + this.row.first);
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
      obj[this[i]] = typeof(this[i]);
    }
    for (i in obj){
      if (obj[i] != 'undefined'){out.push(obj[i] == 'number' ? Number(i) : i);}
    }
    // for (i=0; i < out.length; i++){
    //   this[i] = out[i];
    // }
    // this.splice(out.length, this.length - out.length);
    return out;
    // this = out;
    // return this;
};

//add uppercase first char method to String prototyp
String.prototype.upperFirstChar = function(){
  return this.charAt(0).toUpperCase() + this.slice(1);
};

//add lowercase first char method to String prototyp
String.prototype.lowerFirstChar = function(){
  return this.charAt(0).toLowerCase() + this.slice(1);
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
  var initTime = this.getTime(); 
    day = this.getDay(),
    diff = this.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    returnVal = new Date(this.setDate(diff)).setToMidnight();
    this.setTime(initTime);
    return returnVal;
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
  var initHr = this.getHours(), 
    dif = 0;
  if (initHr > 12){
    dif = -12
  } else if (initHr == 0){
    dif = 12;
  }
  var period = this.getHours() >= 12 ? 'pm' : 'am',
    hr = initHr + dif,
    singDig = this.getMinutes().toString().length == 1 ? true : false,
    min = singDig ? '0' + this.getMinutes().toString() : this.getMinutes();
  return hr + ':' + min + period;
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
    if (result !== undefined){
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

function getRecordsFromModelByIds(model, ids){
  for (var i = 0; i < ids.length; i++){
    records.push(getRecordById(model, id));
  }
  return records;
};

function getRecordFromModelById(model, id){
  // Logger.log('running getRecordFromModelById('+model.instance+', '+id+')');
  for (var i = 0; i < model.data.length; i++) {
    // Logger.log('model.data['+i+'].id: ' + model.data[i].id);
    if (model.data[i].id === id){
      // Logger.log('match found!');
      return model.data[i];
    }
  }
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