function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    name = getResponseByItemTitle(ir, 'Restaurant Name'),
    str = getStr(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com', 'yagil@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[RESTAURANT FEEDBACK] ' + name,
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
  var header = '<p>You received the following feedback: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdDVHTmpVQlQtY3BsQ05XejZVZGsxQ2c&usp=drive_web#gid=0">here</a></p>';
    data = [];
  for (var i = 0; i < ir.length; i++) {
    var pre = getPrefix(i);
    data.push(pre + '<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function getPrefix(i){
  if (i === 0 || i === 1 || i === 2 || i === 4 || i === 6 || i == 8){
      return '<br/>';
  } else {
    return '';
  }
};

function sendEmails(recipients, ep){
  for (var i = 0; i < recipients.length; i++){
    ep.to = recipients[i];
    MailApp.sendEmail(ep);
  }
};
