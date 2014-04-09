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
  // addTest();
};


//** TESTS **//

function testSortByDate(view){
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
    var ret = mod === 'date' ? new Date(2014, 1, num, 1) : new Date(2014, 1, 1, num);
    Logger.log('ret: ' + ret);
    return ret;
  };

  function createEnd(num, mod){
    return mod === 'date' ? new Date(2014, 1, num, 2) : new Date(2014, 1, 1, num);
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
