function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    name = getResponseByItemTitle(ir, 'Restaurant Name'),
    interest = getResponseByItemTitle(ir, 'Level of Interest'),
    str = getStr(ir),
    recipients = ['yagil@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[SALES LEAD] ' + name +' ('+interest+' interest)',
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
  var header = '<p>You received the following sales lead: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdGdSZ190S1d3MjA3T0ZHMS1xUUxEcXc#gid=0">here</a></p>';
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
      return '<p><strong><span style="text-decoration: underline;">BASIC INFO:</span></strong><br/>';
    case 4: //level of interest
      return '<br/>';
    case 7: //contact name
      return '</p><p><strong><span style="text-decoration: underline;">FOLLOW-UP INFO:</span></strong><br/>';
    case 13: //metrics
      return '</p><p><strong><span style="text-decoration: underline;">METRICS:</span></strong><br/>';
    default:
      return '';
  }
};

function sendEmails(recipients, ep){
  for (var i = 0; i < recipients.length; i++){
    ep.to = recipients[i];
    MailApp.sendEmail(ep);
  }
};
