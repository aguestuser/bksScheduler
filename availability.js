/**************************************************
COPYRIGHT 2014 AUSTIN GUEST -- ALL RIGHTS RESERVED
**************************************************/

function refreshView(e){

  var app = UiApp.getActiveApplication(),//open ui instance
    p = e.parameter,//store ui params
    sp = {//initialize view params from ui params
      view: {class: p.class, instance: p.instance, init: 'fromUi', gridType: p.gridType},
      model: {class: 'availabilities', instance: 'index'},
      refs: [{class: 'riders', instance:'info', names: p.riders}, {class: 'restaurants', instance: 'info', names: p.restaurants}],
      dates:{start: p.start, end: p.end}
    };

  var availability = new View(sp);//initialize schedule view
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
    lwp = JSON.parse(JSON.stringify(sp));
  
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
    availability.writeToModel().refreshViews(['grid', 'weekly', 'lookup']);
  }      
};