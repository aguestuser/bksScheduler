function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    rider = getResponseByItemTitle(ir, 'Name'),
    restos = getRestos(ir),
    str = getStr(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com', 'yagil@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[RIDER FEEDBACK] ' + rider + ' on ' + restos,
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

function getRestos(ir){
  var restArr = [];
  for (var i = 1; i < 6; i++){
    var r = getResponseByItemTitle(ir, 'Restaurant ' + i);
    if (r !== ''){
      restArr.push(r);
    }
  }
  return restArr.join(', ');
};

function getStr(ir){
  var header = '<p>You received the following feedback: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdFhwRUFwTkk0ZU9aR09ORUF2ZHVYUkE#gid=0">here</a></p>';
    data = [];
  for (var i = 0; i < ir.length; i++) {
    var pre = getPrefix(i);
    data.push(pre + '<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function getPrefix(i){
  if (i === 0 || i === 1 || i === 4 || i === 7 || i === 10 || i == 13 || i == 16){
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
