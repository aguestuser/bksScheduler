// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//*** vvv UI APP vvv ***//

function initUi(serverHandler){//initiate UI dialog

  Logger.log('running initUI('+serverHandler+')');
  //get sheet and sheet index to determine view to pass to click handler
  var ss = SpreadsheetApp.getActiveSpreadsheet().getName(),
    ws = SpreadsheetApp.getActiveSheet().getName();
    Logger.log('ss: ' + ss);
    Logger.log('ws: ' + ws);
    sheet = new Sheet(ss, ws),
    ref1 = ss == 'schedule' ? 'riders' : 'restaurants',
  //retrieve view's current start and end dates from sheet data
    curStart = new Date().getWeekStart(),
    curEnd = curStart.incrementDate(6);
    
  //construct ui app
  var titles = {
      refreshView: 'Refresh ' + ss + ' view',
      cloneLastWeek: 'Clone last week\'s '+ ss,
      createRecords: 'Create new '+ ss +' records:'
    } 
    app = UiApp.createApplication().setTitle(titles[serverHandler]).setWidth(200).setHeight(240),
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
    submitHandler = app.createServerHandler(serverHandler)
      .setId('submitHandler')
      .addCallbackElement(class)
      .addCallbackElement(instance)
      .addCallbackElement(start)
      .addCallbackElement(end);
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
  
  if (ws == 'grid'){
    var gridTypeLabel = app.createLabel('Grid Type').setId('gridTypeLabel'),
      gridType = app.createListBox().setName('gridType').setId('gridType');
    gridType.setVisibleItemCount(2);
    gridType.addItem('refs');
    gridType.addItem('times');
    gridType.setSelectedIndex(0);
  } else {
    gridType = app.createHidden('gridType', 'refs').setName('refs').setId('refs');
  }
  submitHandler.addCallbackElement(gridType);

  //define button to trigger callback
  var submit = app.createButton('Submit!').addClickHandler(submitHandler);
  
  //add app elements to each other (funky order here?)
  panel.add(startLabel).add(start).add(endLabel).add(end);
  if (ws == 'lookup'){panel.add(restaurantsLabel).add(restaurants).add(ridersLabel).add(riders);}
  if (ws == 'grid'){panel.add(gridTypeLabel).add(gridType);} 

  panel.add(submit);
  app.add(panel);

  //  sheet.g.getParent().show(app);
  SpreadsheetApp.getActiveSpreadsheet().show(app);
};

//** ^^ UI APP ^^ **//

function createMenus() {//creates event triggers for calling functions
    var menuEntries = [
      {
          name: 'Save Edits',
          functionName: 'saveEdits' 
      },{        
          name: 'Send Emails',
          functionName: 'sendEmails'
      },{        
          name: 'Update Calendar',
          functionName: 'updateCalendar'
      },{        
          name: 'Refresh View',
          functionName: 'initRefreshViewUi'
      },{
          name: 'Clone Last Week',
          functionName: 'initCloneLastWeekUi' 
      },{
          name: 'Create Records',
          functionName: 'initCreateRecordsUi' 
      },
    ];
    SpreadsheetApp.getActiveSpreadsheet().addMenu("Functions", menuEntries);
};

function initRefreshViewUi(){
  initUi('refreshView');
};

function initCloneLastWeekUi(){
  initUi('cloneLastWeek');
};

function initCreateRecordsUi(){
  initUi('createRecords');
};

function refreshView(e){

  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    sp = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromUi', gridType: p.gridType},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info', names: p.restaurants}, {class: 'riders', instance:'info', names: p.riders}],
      dates:{start: p.start, end: p.end}
    };
  
  schedule = new View(sp);//initialize schedule view
  schedule.writeToSelf();//write from record list to view ss range
  return app.close();  //close ui
};

function cloneLastWeek(e){
  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    sp = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromLastWeek', gridType: p.gridType},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info', names: p.restaurants}, {class: 'riders', instance:'info', names: p.riders}],
      dates:{start: p.start, end: p.end},
    },
    lwp = JSON.parse(JSON.stringify(sp));
  
  lwp.dates = {
    start: p.start.incrementDate(-7),
    end: p.end.incrementDate(-7),
    weekMap: p.start.incrementDate(-7).getWeekMap()
  };
  lwp.view.init = 'fromUi';

  lwSchedule = new View(lwp);
  sp.lw = lwSchedule;

  schedule = new View(sp);
  schedule.writeToSelf();
  return app.close();
};

function createRecords(e){
  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    sp = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromRange', gridType: p.gridType},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info', names: p.restaurants}, {class: 'riders', instance:'info', names: p.riders}],
      dates:{start: p.start, end: p.end},
      newRecs: true
    };

  schedule = new View(sp);
  if (!schedule.hasErrors()){
    schedule.writeToModel().refreshViews(['grid']);
  }
  return app.close();
};

function saveEdits(){

  var schedule = new View({
      view: {class: 'schedule', instance: getWsName(), init: 'fromRange'},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance:'info'}]
    });
  
  if (!schedule.hasErrors()){
    
    var availability = new View({
      view: {class: 'availability', instance: 'weekly', init: 'fromRel'},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance: 'info'}, {class: 'restaurants', instance: 'info'}],//maybe not necess?
      dates: {start: schedule.dates.start, end: schedule.dates.end},
      rel: {view: schedule, join: 'shiftid', vols: ['status', 'riderid']}
    });

    if(!availability.hasErrors()){
      
      schedule.rel = {view: availability, join: 'availabilityid', vols: ['status', 'restaurantid', 'start', 'end']};
    
      schedule
        .getConflictsWith(availability)
        .showConflicts();
      
      if (!schedule.hasConflicts()){
        schedule
          .writeToRel()
          .writeToModel()
          .refreshViews(['grid'];//, 'weekly', 'update']);  
        availability
          .refreshViews(['grid'];//, 'weekly']); 
      }
    }  
  }          
};

function sendEmails(){
  var schedule = new View({
      view: {class: 'schedule', instance: getWsName(), init: 'fromRange'},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance:'info'}]
    });

  if (!schedule.hasErrors()){
  
    var availability = new View({
      view: {class: 'availability', instance: 'weekly', init: 'fromRel'},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance: 'info'}, {class: 'restaurants', instance: 'info'}],//maybe not necess?
      dates: {start: schedule.dates.start, end: schedule.dates.end},
      rel: {view: schedule, join: 'shiftid', vols: ['status', 'riderid']}
    });

    schedule.rel = {view: availability, join: 'availabilityid', vols: ['status', 'restaurantid', 'start', 'end']};
    
    schedule
      .getConflictsWith(availability)
      .showConflicts();
    
    if (!schedule.hasConflicts()){    
      schedule
        .sendEmails()
        .writeToRel()
        .writeToModel()
        .refreshViews(['grid', 'weekly', 'update']);  
      availability
        .refreshViews(['grid', 'lookup']); 
    }
  }
};

function updateCalendar(){
    var schedule = new View({
      view: {class: 'schedule', instance: getWsName(), init: 'fromRange'},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance:'info'}]
      // vols: {grid: ['riderid', 'status'], list: ['riderid', 'status']},
    });

  schedule
    .writeToCalendar()
    .setVols(['eventid'])
    .writeToModel();

};

