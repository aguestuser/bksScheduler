function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    name = getResponseByItemTitle(ir, 'Restaurant Name'),
    str = getStr(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com', 'yagil@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: '[RESTAURANT REGISTRATION] ' + name,
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
  var header = '<p>You received the following restaurant registration: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdFNaLVh1cTJ6V2RGMGlOZmNBT0NEcFE&usp=drive_web#gid=0">here</a></p>';
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
    case 6: //zone size
      return '</p><p><strong><span style="text-decoration: underline;">WORK REQUIREMENTS:</span></strong><br/>';
    case 12: //shifts needed
      return '</p><p><strong><span style="text-decoration: underline;">SCHEDULING REQUIREMENTS:</span></strong><br/>';
    case 16: //rider payment method
      return '</p><p><strong><span style="text-decoration: underline;">RIDER PAYMENT:</span></strong><br/>';
    case 20: //equipment
      return '</p><p><strong><span style="text-decoration: underline;">RIDER EQUIPMENT:</span></strong><br/>';
    case 21: //agency payment method
      return '</p><p><strong><span style="text-decoration: underline;">RELATIONSHIP WITH AGENCY:</span></strong><br/>';
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
