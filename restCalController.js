//*CONSTRUCT SHEET OBJECT
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
        sheets: ['weekly', 'update', 'lookup', 'grid']
      }
    }; 
  for (var i = 0; i < sheetMap[sheetName].sheets.length; i++){
      sheet[sheetMap[sheetName].sheets[i]] = new Sheet(sheetMap[sheetName].key, i);
  }
  return sheet;
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
  this.headers = this.g.getRange(1, 1, 1, this.col.last).getValues()[0];

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
  			Logger.log('rowNum: ' + (i + 2));
  			return (i + 2);
  		}
  	}
  };

  this.getRow = function(row){
    return this.g.getRange(row, this.col.first, 1, this.col.num).getValues();    
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
  	Logger.log('this.headers.length: ' + this.headers.length);
  	for (var i = 0; i < this.headers.length; i++){
  		Logger.log('headers['+i+']: ' + this.headers[i]);
  		if (this.headers[i] == headerName) {return i + 1};
  	}
  }

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
};

//*CREATE MENU BUTTONS

function createMenus() {
    var menuEntries = [
      {        
        name: "Add Calendars",
        functionName: "addCalendars" 
      }
    ];
    SpreadsheetApp.getActiveSpreadsheet().addMenu("Functions", menuEntries);
};

function addCalendars () {
	var info = constructSheet('Restaurants').info;
	Logger.log('info.data.length: '+ info.data.length);
	for (var i = 0; i < info.data.length; i++){
		Logger.log('info.data['+i+'].calendarid: ' + info.data[i].calendarid);
		if (!info.data[i].active) {
			continue;
		} else if (info.data[i].calendarid !== undefined) {
			continue;
		} else {
			Logger.log('Creating Calendar for ' + info.data[i].name + '.')
			addCalendar(info, i); 
		}	
	}
};

function addCalendar(info, i){
	var calId = CalendarApp.createCalendar(info.data[i].name).getId();
	info.updateCell(info.getRowNum(info.data[i].id), info.getColNum('calendarid'), calId);
}