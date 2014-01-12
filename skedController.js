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
        sheets: ['weekly', 'update', 'lookup', 'grid']
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
        sheets: ['weekly', 'update', 'lookup', 'grid']
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
}

//*MODIFY ARRAY PROTOTYPE

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


  /*param conditions:
    *weekly:
      - start/end: user input
      - restaurant/rider: default to 'all'
    *update
      - start/end: user input
      - restaurant/rider: default to 'all'
      -> pass extra param so handler function knows to: filter shifts by schedule.data[i].status == 'unassigned' || schedule.data[i].status == 'delegated'
    *lookup:
      - all fields user inputed
  */

/*FOR TESTING
function initUpdateViewUi(){
  var app = UiApp
          .createApplication()
          .setTitle('Update Schedule View')
          .setHeight(400)
          .setWidth(400);
  var panel = app.createVerticalPanel();
  var restaurants = app.createTextBox()
      .setName('Input restaurants')
      .setId('restaurants');

  panel.add(restaurants);
  app.add(panel);
  SpreadsheetApp.getActive().show(app);

}
FOR TESTING*/


//initiate UI dialog
function initUpdateViewUi(){

  //get sheet and sheet index to determine view to pass to click handler
  var sheetName = SpreadsheetApp.getActiveSheet().getName(),
    sheets = constructSheets(['Schedule']),
    sheet = sheets.Schedule[sheetName];

  //retrieve view's current start and end dates from sheet data
  
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



/*FOR TESTING
function initUpdateViewUi(){
  var ev = {
    parameter: {
      start: new Date(2013, 11, 16),
      end: new Date(2013, 11, 22),
      restaurants: 'all',
      riders: 'all',
      view: 'weekly'
    }
  };
  updateView(ev);  
};
*/

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
    sheets = constructSheets(['Restaurants', 'Riders', 'Shifts', 'Schedule']),
    schedule = sheets.Schedule[e.parameter.view],
    //retrieve ids for restaurants and riders given in params
    restaurantIds = getIds(sheets.Restaurants.info.data, e.parameter.restaurants.split(', '));
    riderIds = getIds(sheets.Riders.info.data, e.parameter.riders.split(', '));
    //if restaurant and rider ids are found, retrieve corresponding shifts and populate view with them
    if (restaurantIds.length > 0 && riderIds.length > 0) {
      shifts = getShifts(e.parameter.start, e.parameter.end, restaurantIds, riderIds, e.parameter.view);
      setScheduleRange(shifts, e.parameter.view);
      //if not, terminate execution and throw the appropriate error message
    } else {
      if (restaurantIds.length <= 0){
        SpreadsheetApp.getActiveSpreadsheet().toast('EROR: No restaurants matching the specified names were retrieved.');
      }
      if (riderIds.length <= 0){
        SpreadsheetApp.getActiveSpreadsheet().toast('EROR: No riders matching the specified names were retrieved.');
      }
    }

  //CLOSURES

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


  function getShifts(start, end, restaurantIds, riderIds, view){
    var data = sheets.Shifts.shifts.data,
      shifts = [];
    Logger.log('restaurantIds: ' + restaurantIds);
    Logger.log('riderIds: ' + riderIds);
    Logger.log('data.length: ' + data.length);
    for (var i = 0; i < data.length; i++){
      Logger.log('i: ' + i);
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
        if (e.parameter.riders == 'all'){
          if (restaurantIds.indexOf(data[i].restaurantid) >=0){
            shifts.push(data[i]);//add retrieved shifts to shifts[]
          }
        //if all restaurants are specified in params, retrieve shifts with riders matching those in params        
        } else if (e.parameter.restaurants == 'all'){
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
    return shifts;
  };

  function setScheduleRange(shifts, view){
    var sheet = sheets.Schedule[view],
      range = [];
    //clear current view
    sheet.g.getRange(sheet.row.first, sheet.col.first, sheet.row.num, sheet.col.num).clear({contentsOnly:true});
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
        shifts[i].billing
      ];
    }
    sheet.g
    .getRange(sheet.row.first, sheet.col.first, range.length, range[0].length)
    .setValues(range);
  };
  //close uiApp instance
  return app.close();
};

function updateShifts(){
  var sheets = constructSheets(['Shifts', 'Schedule']),
    shifts = sheets.Shifts.shifts,
    schedule = sheets.Schedule[SpreadsheetApp.getActiveSheet().getName()],
    idMatchFound = false;
  //copy shift data from rows in view that match rows in model by id 
  for (var i = 0; i < schedule.data.length; i++){
    //skip rows with no data
    /*
    if (typeof schedule.data[i].id != 'number'){
      continue;
    }
    */
    for (var j = 0; j < shifts.data.length; j++){
      /*
      //skip rows with no values
      if (typeof shifts.data[i].id != 'number'){
        continue;
      }
      */
      //find all shifts in model with ids matching those in schedule range and overwrite them with data from schedule
      if (schedule.data[i].id == shifts.data[j].id){
        shifts.updateRow(schedule, i + 2, j + 2);
        idMatchFound = true;
      }
    }
    //if a row in the view doesn't match a row in the model by id, create a new row and append it to the model
    if (!idMatchFound) {
      shifts.appendRow(schedule, i + 2);
    }
  }
    
  //CALLBACKS
  updateAssignments();
  updateCalendars(schedule, shifts);
  SpreadsheetApp.getActiveSpreadsheet().toast('Edits successfully saved!');

};

function updateCalendars(schedule, shifts){
  var events = getEvents(schedule),
    statusCodes = {
      unassigned: '???',
      delegated: '**' + rider + '??',
      confirmed: rider + ' (c)',
      cancelled: 'CANCELLED'
    };
  //loop through all shifts in view
  for (var i = 0; i < schedule.length; i++){
  //check to see if calendars exist for all restaurants being updated
  if (!calExists(schedule[i].restaurantid)){
    //if any calendars don't exist, throw an error message warning the user to create one and proceed
    SpreadsheetApp.getActiveSpreadsheet.toast('ERROR: There is no calendar for ' + schedule[i].restaurantname + '. Please go to the restaurants model and create one.')
  }

  //check to see if calendar events exist for all shifts
  if (schedule[i].calid.length > 0 && schedule[i].calid != 'undefined') ?
      //if a event exists, update it
      getEventById(events, calId).setTitle(statusCodes[schedule[i].status]); :
      //if not, create one
      createEvent(schedule[i].riderNick);
  }
}

function 

function getEvents(calIds, schedule){
  var events = [],
    tempEvents = [];
  //construct 2-d array of event ids matching start and end times
  for (var i = 0; i < schedule.length; i++){
    tempEventIds.push(
      CalendarApp
      .getCalendarById(getRestCalId(schedule[i].restaurantid))
      .getEvents(shifts[i].start, shifts[i].end)
    )
  }
  for (var i = 0; i < tempEventIds.length; i++) {
    for (var j = 0; j < tempEventIds[i].length) {
      events.push(tempEventIds[i][j]);
    }
  }
  return events;
};

function getRestCalId(restId){
  var info = constructSheet(['Restaurants']).info;
  for (var i = 0; i < info.length; i++){
    if (info[i].id == restId) {
      return info[i].calid;
    }  
  }
};

function updateEvent(events, calid, rider, status, statusCodes){
  
};

function getEventById(events, eventIds){
  for (var i = 0; i < eventIds.length; i++){
    for (var j = 0; j < events.length; j++){
      if (events[j].getId() == eventIds[i]) {return events[j];}      
    }
  }
};


function createEvent(shift, statusCodes){
  var event = CalendarApp
    .getCalendarById(getRestCalId(shift.restaurantid))
    .createEvent(statusCodes[shift.status], shift.start, shift.end); 
  appendEventId(shift.id, event.getId());
}

function appendEventId(shiftId, eventId){
  var shifts = constructSheets(['Shifts']).Shifts.shifts;
  for (var i = 0; i < shifts.length; i++){
    if (shifts[i].id == shiftId){
      shifts[i].calid = eventId;
    }
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
