function handleSubmission(e) {
  var ir = e.response.getItemResponses();
    handleEmail(ir);
  };

// vv STAFF EMAIL vv //

function handleEmail(ir){
    rest = getResponseByItemTitle(ir, 'Restaurant Name'),
    date = getResponseByItemTitle(ir, 'Shift 1 Start'),
    mult = getResponseByItemTitle(ir, 'Shift 2 Start') ? true : false,
    body = getEmailBody(ir),
    recipients = ['austin@bkshift.com', 'tess@bkshift.com'],
    ep = {
        name: 'SYS ADMIN',
        to: '',
        subject: getSubject(rest, mult, date),
        htmlBody: body
      };
    sendEmails(recipients, ep);
};

function getSubject(rest, mult, date){
  var subj = '[SHIFT REQUEST] ' + rest + ' has requested ';
  return mult ? subj.concat('multiple shifts this week') : subj.concat('a shift on ' + date);
}

function getEmailBody(ir){
  var header = '<p>You received the following shift request: </p>',
    footer = '<p>To view the form data, click <a href ="https://docs.google.com/a/bkshift.com/spreadsheet/ccc?key=0AkfgEUsp5QrAdGpFakRlc0tsLTZsUk94ZXY1djVaNWc">here</a></p>';
    data = [];
  for (var i = 0; i < ir.length; i++) {
    var pre = getPrefix(i);
    data.push(pre + '<strong>'+ ir[i].getItem().getTitle()  + '</strong>: ' + ir[i].getResponse());
  };
  return header + '<p>'+ data.join('<br/>') + '</p>' + footer;
};

function getPrefix(i){
    switch(i){
      case 0: //restaurant name
        return '<p><strong><span style="text-decoration: underline;">RESTAURANT INFO:</span></strong><br/>';
      case 6: //shift 1
        return '</p><p><strong><span style="text-decoration: underline;">SHIFT INFO:</span></strong><br/>';
      case 26: //notes
        return '</p><p><strong><span style="text-decoration: underline;">NOTES:</span></strong><br/>';
      default:
        return '';
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
