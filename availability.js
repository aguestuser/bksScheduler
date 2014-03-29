/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

function createMenus() {//creates event triggers for calling functions
    var menuEntries = [
      {
          name: 'Save Edits',
          functionName: 'saveEdits' 
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
    ap = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromUi', gridType: p.gridType},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance:'info', names: p.riders}, {class: 'restaurants', instance: 'info', names: p.restaurants}],
      dates:{start: p.start, end: p.end}
    };

  var availability = new View(ap);//initialize schedule view
  availability.writeToSelf();//write from record list to view ss range
  return app.close();  //close ui
};

function cloneLastWeek(e){
  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    ap = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromLastWeek', gridType: p.gridType},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance:'info', names: p.riders}, {class: 'restaurants', instance: 'info', names: p.restaurants}],
      dates:{start: p.start, end: p.end},
    },
    lwp = JSON.parse(JSON.stringify(ap));
  
  lwp.dates = {
    start: p.start.incrementDate(-7),
    end: p.end.incrementDate(-7),
    weekMap: p.start.incrementDate(-7).getWeekMap()
  };
  lwp.view.init = 'fromUi';

  var lwAvail = new View(lwp);
  ap.lw = lwAvail;

  var availability = new View(ap);
  availability.writeToSelf();
  return app.close();
};

function createRecords(e){
  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    ap = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromRange', gridType: p.gridType},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance:'info', names: p.riders}, {class: 'restaurants', instance: 'info', names: p.restaurants}],
      dates:{start: p.start, end: p.end},
      newRecs: true
    };

  var availability = new View(ap);
  availability.writeToModel().refreshViews(['grid', 'weekly', 'lookup']);
  return app.close();
};

function saveEdits(){

  var availability = new View({
      view: {class: 'availability', instance: getWsName(), init: 'fromRange'},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance:'info'}, {class: 'restaurants', instance: 'info'}]
    });
  
  if (!availability.hasErrors()){
    
    var schedule = new View({
      view: {class: 'schedule', instance: 'weekly', init: 'fromRel'},
      model: {class: 'shifts', instance: 'index'},
      refs: [{class: 'restaurants', instance: 'info'}, {class: 'riders', instance: 'info'}],
      dates: {start: availability.dates.start, end: availability.dates.end},
      rel: {view: availability, join: 'availabilityid', vols: ['status', 'restaurantid', 'start', 'end']}
    });

    if(!schedule.hasErrors()){
      
      availability.rel = {view: schedule, join: 'shiftid', vols: ['status', 'riderid']};

      availability
        .writeToRel()
        .writeToModel()
        .refreshViews(['grid', 'weekly']);  
      schedule
        .refreshViews(['grid', 'weekly', 'update']); 
    }
  }   
};










