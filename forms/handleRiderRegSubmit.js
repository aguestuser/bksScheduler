

function testDatabaseSubmit(){
  handleDatabaseSubmit(constructIr());
};

function testStaffEmail(){
  handleStaffEmail(constructIr());
};

function testRiderEmail(){
  handleRiderEmail(constructIr());
};

function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    ir_ = parseIr(ir);
    handleStaffEmail(ir);
    handleRiderEmail(ir_);
    handleDatabaseSubmit(ir_);
  };

function parseIr(ir){
  var ir_ = {};
  _.each(ir, function (ir) {
    ir_[ir.getItem().getTitle()] = ir.getResponse();
  });
  return ir_;
};

function constructIr(){
  return {
    Name: 'Testy McTester',
    Phone: '555-555-5555',
    Email: 'guest.austin@gmail.com',
    Email: 'guest.austin@gmail.com',
    Residence: 'test city, usa',
    'Commitment Level': 'Full Time',
    'Payment Method': 'Cash,Check,Car',
    'Start Date': '2014-04-23',
    Schedule: 'Monday AM,Monday PM,Tuesday AM,Tuesday PM,Wednesday AM,Wednesday PM,Thursday AM,Thursday PM,Friday AM,Friday PM,Saturday AM,Saturday PM,Sunday AM,Sunday PM',
    'Early Mornings': 'Yes',
    'Availability Comments': 'work me all the time!',
    Equipment: 'Bike,Bike lock,Cell phone,Smart phone (with GPS),Delivery bag (Insulated),Delivery bag (Non-insulated),Spare tubes,Hand pump',
    Skills: 'Fixing flats,Bike repair,English',
    'Pizza Experience': 'Yes',
    Experience: 'so much experience!',
    Geography: 'all of the parts!',
    'TOE Consent': 'Yes',
    'ID submitted?': 'Yes',
    'Experience Level': '75',
    Reliability: '1',
    Likeability: '1',
    Speed: '1',
    'HR Comments': 'this guy sucks.'
  }
};

function getResponseByItemTitle(ir, title){
  for (var i = 0; i < ir.length; i++) {
    if (ir[i].getItem().getTitle() === title){
      return ir[i].getResponse();
    }
  }
};

function sendEmails(recipients, ep){
  for (var i = 0; i < recipients.length; i++){
    ep.to = recipients[i];
    MailApp.sendEmail(ep);
  }
};

// vv STAFF EMAIL vv //

function handleStaffEmail(ir){
    name = getResponseByItemTitle(ir, 'Name');
    body = getStaffEmailBody(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[RIDER REGISTRATION] ' + name,
        htmlBody: body
      };
    sendEmails(recipients, ep);
};


function getStaffEmailBody(ir){
  var header = '<p>You received the following rider registration info: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdEFVaS1fZS1XWHQzbE5PbEo0RnhGNnc#gid=0">here</a></p>';
    data = [];
  for (var i = 0; i < ir.length; i++) {
    var pre = getPrefix(i);
    data.push(pre + '<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function getPrefix(i){
    switch(i){
      case 0: //name
        return '<p><strong><span style="text-decoration: underline;">CONTACT INFO:</span></strong><br/>';
      case 4: //commitment level
        return '</p><p><strong><span style="text-decoration: underline;">TYPE OF WORK SOUGHT:</span></strong><br/>';
      case 6: //start date
        return '</p><p><strong><span style="text-decoration: underline;">AVAILABILITY:</span></strong><br/>';
      case 10://equipment
        return '</p><p><strong><span style="text-decoration: underline;">JOB QUALIFICATIONS:</span></strong><br/>';
      case 15://toe consent
        return '</p><p><strong><span style="text-decoration: underline;">TERMS OF EMPLOYMENT:</span></strong><br/>';
      case 17://experience level
        return '</p><p><strong><span style="text-decoration: underline;">HR EVALUATION:</span></strong><br/>';
      default:
        return '';
    }
};

//vv RIDER EMAIL vv//

function handleRiderEmail(ir){
  var name = ir.Name;
    email = ir.Email;
    body = getRiderEmailBody(),
    recipients = [email],
    ep = {
        name: 'BK SHIFT',
        to: '',
        replyTo: 'tess@bkshift.com',
        subject: 'WELCOME TO BK SHIFT!',
        htmlBody: body
      };
    sendEmails(recipients, ep);
};


function getRiderEmailBody(){
  return '<p>Hi there I&#39;m Tess Cohen, Account Manager for BK Shift.I&#39;ll be helping to handle your schedule and feedback, alongside our Account Manager and IT Director, Austin Guest. We are looking forward to working with you! :)</p><p><strong>Please respond to confirm you&#39;ve read and understand the following important information about working with BK Shift:</strong></p><p><span style="text-decoration: underline;"><strong>POINT SYSTEM</strong></span></p><p>BK Shift assigns its riders to restaurants based on a point system measuring rider performance. This guarantees that the riders who have earned it will get the best shifts.</p><ul><li><strong>The point system rewards:</strong></li><ul><li>taking emergency shifts(WE LOVE YOU IF YOU DO THIS!) [+15 points]</li><li>compliments from restaurants [+10 points]</li><li>responding to shift assignments [+5/+10 points, depending on notice]</li><li>working all confirmed shifts (no canceling) [+ 5 points]</li><li>being reported as fast [+5 points]</li></ul></ul><ul><li><strong>The point system penalizes:</strong></li><ul><li>no-call no-show (WORST THING YOU CAN DO! You will be placed on emergency-only status.) [-20 points]</li><li>being late [-5 points]</li><li>being late without calling to let us know [- 10 points]</li><li>cancelling confirmed shifts [-5/-10 points, depending on notice]</li><li>complaints from restaurant [-10 points]</li><li>not responding to shift assignments [-5 points]</li><li>being reported as slow [-5 points]</li></ul></ul><p><span style="text-decoration: underline;"><strong>CHECK-IN POLICY</strong></span></p><p>To ensure our riders arrive on time and do not unexpectedly no-show, we have instituted the following check-in policy:</p><p>Please text347-640-64842 hours* prior to your shift&#39;s start time to let us know you will be there on time. If we don&#39;t hear from you after 1.5 hours, we will text you. If we still haven&#39;t heard from you 1 hour before your shift is scheduled to start, we will assume you are not working and will fill it with someone else. Even if you do show up, preference will be given to the emergency rider.</p><p>*= for shifts that start earlier than 9a, please text your confirmation before going to bed the night before</p><p><strong><span style="text-decoration: underline;">WEEKLY SCHEDULE</span></strong></p><p><strong>Wednesday afternoon:</strong> Tess sends you availability request email.<br /><strong>Thursday afternoon: </strong>You respond to availability request email.<br /><strong>Friday afternoon:</strong> Tess emails your upcoming week&rsquo;s schedule.<br /><strong>Before Saturday afternoon:</strong> Respond to confirm your schedule.<br /><strong>Friday-Sunday: </strong>Check your email to see if you have been assigned extra shifts.<br /><strong>Monday-Sunday:</strong> Be available by text, phone, and email for emergency shifts.</p><p><span style="text-decoration: underline; background-color: #ffff00;"><strong>IMPORTANT, PLEASE REVIEW: DOT REQUIREMENTS</strong></span></p><p>This is useful information. Also information that can help you get more work. Some of our busy restaurants require that you follow the following DOT rules in order to get shifts with them.</p><p>For your safety, and for the safety of others, please review Department of Transportation (DOT) requirements below:</p><p>DOT has recently passed relevant legislature that directly relates to your work. To put it simply they require you to do the following:</p><ol><li>Ride with a helmet</li><li>Ride with a front white light</li><li>Ride with a back red light</li><li>Have a bell/whistle</li><li>Ride with a reflective vest (should be provided by the restaurant).</li></ol><p>Even though technically they require that the restaurants provide you with this equipment, you must supply it yourself working with BK Shift (some restaurants may provide it for you already).</p><p>Please review the online course at:</p><p><a href="http://www.nyc.gov/html/dot/downloads/pdf/commercial-bicyclist-safety-course.pdf">http://www.nyc.gov/html/dot/downloads/pdf/commercial-bicyclist-safety-course.pdf</a></p><p>If you have any questions, please feel free to respond back to this e-mail directly.</p><p>Thanks a bunch, and welcome to the BK Shift team!</p><p>Best,</p><p>Tess Cohen<br/>Account Executive<<br/>BK Shift, LLC<br/><a href="mailto:tess@bkshift.com">tess@bkshift.com</a><br/>347-460-6484</p>';
};
  


//vv DATABASE SUBMISSION vv//



function handleDatabaseSubmit(ir_){
  var translations = {
      info: {
        name: ir_.Name.slice(0, ir_.Name.indexOf(' ') +2),
        fullName: ir_.Name.toLowerCase(),
        active: true,
        commitment: ir_['Commitment Level']
        hired: new Date(),
        start: ir_['Start Date'],
        onTheBooks: irContains('Payment Method', 'Check')      
      },
      assets: {
        name: ir_.Name.slice(0, ir_.Name.indexOf(' ') +2),
        bike: irContains('Equipment', 'Bike'),
        bikeLock: irContains('Equipment', 'Bike lock'),
        cellPhone: irContains('Equipment', 'Cell phone'),
        smartPhone: irContains('Equipment', 'Smart phone'),
        bag: irContains('Equipment', 'Non-insulated'),
        heatedBag: irContains('Equipment', 'Insulated'),
        pump: irContains('Equipment', 'Hand pump'),
        tubes: irContains('Equipment', 'Spare tubes'),
        ar: irContains('Payment Method', 'Car'),
        repair: irContains('Skills', 'Bike repair'),
        flats: irContains('Skills', 'Fixing flats'),
        earlyMorning: irContains('Early Mornings', 'Yes'),  
        pizza: irContains('Pizza Experience', 'Yes'),
        initialConflicts: ir_.Conflicts,
        idSubmitted: irContains('ID submitted?', 'Yes'),
        toeConsent: irContains('TOE Consent', 'Yes')
      },
      rating: {
        hiringAssessment: ir_['HR Comments'],
        initialPoints: ir_['Experience Level']
      }
    },
    info = new Sheet ('riders', 'info'),
    assets = new Sheet ('riders', 'assets'),
    rating = new Sheet('riders', 'rating'),
    tabs = [info, assets, rating];
  _.each(tabs, function (tab){
    tab.newData = {};
    _.each(tab.headers, function (header){
      if (header in translations[tab.instance]){
        tab.newData[header] = translations[tab.instance][header];
      } else if (header == 'id'){
        Logger.log('tab: ' + tab);
        tab.newData.id = tab.row.getLast() - tab.row.first +1;
      } else {
        tab.newData[header] = ir_[header.upperFirstChar()];
      }
    });
    Logger.log('tab.g: ' + tab.g);
    tab.g.appendRow(toRange(tab.newData, tab.headers));
  });

  //CLOSURE  
  function irContains(index, substr){
    return ir_[index].indexOf(substr) == -1 ? false : true;  
  };

};