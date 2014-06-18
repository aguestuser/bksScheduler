function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    riderName = getResponseByItemTitle(ir, 'Rider Name'),
    restoName = getResponseByItemTitle(ir, 'Restaurant Name'),
    str = getStr(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com', 'yagil@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[RESTAURANT GRIEVANCE] ' + restoName + ' has a complaint about ' + riderName,
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

function getStr(ir){
  var header = '<p>You received the following grievance report: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdERmMWJyRkpPTXhrTE1zd0NqRWF0NUE#gid=0">here</a></p>';
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
