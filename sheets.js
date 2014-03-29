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
        scheduleGridMaps: {
          key: '0AkfgEUsp5QrAdEE4eUhDT2RnNmlwRnQ0dkRsSHZlS3c',
          worksheets: ['rowmap', 'cellmap']
        },
        availability: {
          key: '0AkfgEUsp5QrAdG54d2VpakNXZEFsS05yRjByQmxwbmc',
          worksheets: ['grid', 'weekly', 'lookup']
        },
        availabilityParams:{
          key: '0AkfgEUsp5QrAdHBqa2tkTXlwVnBoY0M5cmxrOUtRMVE',
          worksheets: ['grid', 'weekly','lookup']
        },
        availabilityGridMaps: {
          key: '0AkfgEUsp5QrAdHloc1pSM0YtQjBxdjV2Qktrdzd4bHc',
          worksheets: ['rowmap', 'cellmap']
        },
        emailElements: {
          key: '0AkfgEUsp5QrAdDBqR1VRNVJzZ3RPTU5jNGNPUkJYY1E',
          worksheets: ['notes', 'reminders', 'users']
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