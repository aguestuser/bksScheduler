
Date.prototype.incrementDate = function(numDays){
  return new Date(this.getTime() + numDays*(24 * 60 * 60 * 1000));
};

Date.prototype.setToMidnight = function(){
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0);
  this.setMilliseconds(0);
  return this;
};

Date.prototype.getWeekStart = function(){
  var initTime = this.getTime(); 
    day = this.getDay(),
    diff = this.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    returnVal = new Date(this.setDate(diff)).setToMidnight();
    this.setTime(initTime);
    return returnVal;
};

function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    rider = getResponseByItemTitle(ir, 'Rider Name'),
    weekStart = getWeekStart(new Date());
    str = getStr(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[AVAILABILITY SUBMISSION] from ' + rider + ' for week of ' + weekStart,
        htmlBody: str
      };
    sendEmails(recipients, ep);
  };

function getResponseByItemTitle(ir, title){
  for (var i = 0; i < ir.length; i++) {
    if (ir[i].getItem().getTitle() === title){
      return ir[i].getResponse();
    }
  }
};

function getWeekStart(now){
  var lastWeekStart = now.getWeekStart(),
    nextWeekStart = lastWeekStart.incrementDate(7);
  return (nextWeekStart.getMonth() + 1) +'/'+nextWeekStart.getDate()+'/'+nextWeekStart.getYear();
};

function getStr(ir){
  var header = '<p>You received the following availability submission: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdFVMY2tPZFRSRmU2bms2X0hoUVJFa3c">here</a></p>';
    data = [];
  for (var i = 0; i < ir.length; i++) {
    data.push('<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function sendEmails(recipients, ep){
  for (var i = 0; i < recipients.length; i++){
    ep.to = recipients[i];
    MailApp.sendEmail(ep);
  }
};


