// Written by Austin Guest, 2014. 
// This is free software licensed under the GNU General Public License v3. 
// See http://www.gnu.org/licenses/gpl-3.0.txt for terms of the license.

//URL FOR TEST RESULTS: https://script.google.com/a/macros/bkshift.com/s/AKfycby3TGiZ_jVpfdy5b2nP6QZ8r6kAAWVjqaXqlm6GI8M/dev

//** CALLING FUNCTIONS *//

QUnit.helpers(this);

function doGet(e) {
  QUnit.urlParams( e.parameter );
  QUnit.config({ title: "Unit tests for BKS Scheduler scripts" });
  QUnit.load(tests);
  return QUnit.getHtml();
};

function tests(){
  testSortByDate();
  testJoinFuncs();
  // addTest();
};

function testSaveEditsFromGrid(){
  saveEdits('grid');
};

function testSaveEditsFromWeekly(){
  saveEdits('weekly');
};

function testSaveEditsFromUpdate(){
  saveEdits('update');
};

//** TESTS **//

function testJoinFuncs(){

  var sked = {}, avail = {};
  shifts = [
    1shiftNoJoin:[
      {
        id: 0,
        start: new Date(2014, 0, 1, 11),//11am-5pm shift
        end: new Date(2014, 0, 1, 17),
        am: true,
        pm: false,
        restaurantid: 0,
        riderid: 0,
        status: 'proposed',
        availabilityid: undefined
      }
    ],
    1shiftJoin: [
      {}
    ],
    2shiftsJoins: [
      {},
      {
        id: 0,
        start: new Date(2014, 0, 1, 17),//5pm-11pm shift
        end: new Date(2014, 0, 1, 21),
        am: false,
        pm: false,
        restaurantid: 0,
        riderid: 0,
        status: 'confirmed'
        availabilityid: 0        
      }
    ]
  ];

  _extend(shifts.1shiftJoin[0], shifts.1shiftNoJoin[0]);
  shifts.1shiftJoin[0].status = 'confirmed';
  shifts.1shiftJoin[0].availabilityid = 0;
  _.extend(shifts.2shiftsJoins[0], shifts.1shiftJoin);

  avail.recordList =[
    {
      id: 0,
      start: new Date(2014, 0, 1, 0),
      end: new Date(2014, 0, 1, 0),
      am: true, 
      pm: false,
      riderid: 0,
      restaurantid: undefined,
      shiftid: undefined
    }
  ];
  //test 1 shift to 1 avail (no join yet)
  sked.recordList = shifts.1shiftNoJoin;
  avail.recordList = avails.1availNoJoin;
  sked.writeToRel();
  test('1 shift to 1 avail (no pre-existing join)', function (sked, avail){
    equal(sked.recordList[0].availabilityid, avail.recordList[0].id, 'sked\'s availabilityid set to corresponding avail\'s id');
    equal(avail.recordList[0].restaurantid, sked.recordList[0].id, 'avail restaurantid set to corresponding shift\'s restaurantid');
    equal(avail.recordList[0].restaurantid, 'avail\'s shiftid set to corresponding shift\'s id');
    equal(availrecordList[0].start.getTime(), sked.recordList[0].start.getTime(), 'avail start set to corresponding shift start');
    equal(avail.recordList[0].end.getTime(), sked.recordList[0].end.getTime(), 'avail end set to corresponding shift end')
    //can't run model test because dependent on a spreadsheet range that i can't simulate given the current structure of the subroutine
  });
  // test 1 shift to 1 avail (pre-existing join)
  sked.recordList = shifts.1shiftsJoin;
  avail.recordList = avails.1availJoin;
  test();

  //test 2 avails to 1 shift (shift 0 was joined to avail 0, now joined to avail 1)
  sked.recordList = shifts.1shiftJoin();
  avail.recordList = avails.
  sked.writeToRel();
  test('2 avails to 1 shift', function (sked, avail){
    equal(sked.recordList[0].availabilityid, availability.recordList[1].id, 'shift availabilityid matches id of new avail');
    equal(avail.recordList[1].shiftid, sked.recordList[0].id, 'avail shiftid matches id of shift');
    equal(availabilityid.recordList[1].restaurantid, sked.recordList[0].restaurantid, 'new avail restaurantid matches shift restaurantid');
    equal(availabilityid.recordList[0].shiftid, undefined, 'old avail shiftid set to undefined');
    equal(availabilityid.recordList[0].restaurantid, undefined, 'old avail restaurantid set to undefined');
  });


  //test 2 shifts to 1 avail

};

function testSortByDate(){
  var nums = [1,2,3], 
    startDates = nums.map(function (a) {return createStart(a, 'date');}),
    endDates = nums.map(function (a) {return createEnd(a, 'date');}), 
    startHours = nums.map(function (a) {return createStart(a, 'hour');}),
    endHours = nums.map(function (a) {return createEnd(a, 'hour');});

  Logger.log('startDates: ' + startDates);

  var descDates = getRecs(startDates, endDates, 'descending'),
    ascDates = getRecs(startDates, endDates, 'ascending'),
    ascHours = getRecs(startHours, endHours, 'ascending'),
    descHours = getRecs(startHours, endHours, 'descending');
  
  test('sort dates from descending to ascending', function(){
    deepEqual(sortByDate(descDates), ascDates, 'Dates in descending order sorted to ascending order.');
  });

  test('sort same day but different hours from descending to ascending', function(){
    deepEqual(sortByDate(descHours), ascHours, 'Hours in descending order sorted to ascending order.')
  });
  
  // function createStartDate(num){
  //   createStart(num, 'date');
  // };

  function createStart(num, mod){
    Logger.log('running createStart('+num+', '+mod+')');
    var ret = mod === 'date' ? new Date(2014, 0, num, 1) : new Date(2014, 1, 1, num);
    Logger.log('ret: ' + ret);
    return ret;
  };

  function createEnd(num, mod){
    return mod === 'date' ? new Date(2014, 0, num, 2) : new Date(2014, 1, 1, num);
  };

  function getRecs(starts, ends, sort){
    var recs = [];
    if (sort === 'ascending'){
      for (var i = 0; i < starts.length; i++) {
        createRec(starts[i], ends[i], recs);
      };
    } else if (sort === 'descending'){
      for (var i = starts.length - 1; i >= 0; i--) {
        createRec(starts[i], ends[i], recs);
      };
    }
    return recs;

    function createRec(start, end, recs){
      recs.push({
        id: 0,
        start: start,
        end: end,
        restaurantid: 4,
        riderid: 1
      });
    };
  };
};

//** FUNCTIONS UNDER TEST **//

function sortByDate (recs){
  recs.sort(function(a,b){
    if (a.start.getTime() < b.start.getTime()){return -1;}
    if (a.start.getTime() > b.start.getTime()){return 1;}
  });
  return recs;
};
