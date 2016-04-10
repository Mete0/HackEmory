var express = require('express');
var request = require('request-promise');
var requestCb = require('request');
var nlp      = require('./nlp.js');
var parser   = require('./parser.js');
var bodyParser = require('body-parser');
var app = express();
var Slackhook = require('slackhook');
var calendarApi = require('./calendarApi');
var slackApi = require('./slackApi');
var slack = new Slackhook({
    domain: 'hackemorygroup.slack.com',
    token: 'rdNKT6iSLcUvk8DYSi6Lw7na'
});
var portNum = process.env.PORT || 8888;
var slackWebhookUrl = 'https://hooks.slack.com/services/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';

app.use(bodyParser.urlencoded());

app.post('/', function(req, res) {
    var hook = slack.respond(req.body);
    var msg = hook.text;
    sendMessage(msg);
    res.send("fdsfsa");
});

app.get('/penis', function(req, res) {
    slackApi.auth();
    res.send('fdsagdsa');
});

app.post('/slack', function(req, res) {
  var hook = slack.respond(req.body);
  var msg = hook.text;
  var options = nlp.dateTimeOptions;
  var date = null;
  var obj = {};
  options.form.text = msg;
  request(options)
    .then(function(nlpRes) {
      var nlpInfo = JSON.parse(nlpRes);
      console.log(nlpInfo);
      var dates = nlpInfo.dates;
      if (dates && dates.length > 0) {
        sendMessage("Event "+msg+" was saved to calendar");
        date = dates[0].date;
        return date;
      } else {
        console.log("no dates");
        return false;
      }
    })
    .then(function(dates) {
      if (dates) {
        return slackApi.getEmails();
      }
      return false;
    })
    .then(function(emails) {
      console.log("email");
      obj.emails = emails;
      if (obj) {
        var options = nlp.relationOptions;
        options.form.text = msg;
        return request(options)
          .then(function(nlpRes) {
            var entities = JSON.parse(nlpRes).entities;
            var location = null;
            var title = null;
            if (entities) {
              location = entities.find(function (entity) {
                return entity.disambiguated;
              });
              title = entities.find(function (entity) {
                return entity.type !== "Person";
              });
              obj.title = title ? title.text : null;
              obj.location = location ? location.text : null;
            }
            return obj;
          });
      }
      return false;
    })
    .then(function(obj) {
      if (obj) {
        return calendarApi.addEvent(obj.emails, msg, date, obj.location, obj.title);
      }
      return false;
    })
})

app.get('/checkMsg', function(req, res) {
  return res.send('/checkMsg ran');
})

app.get('/tagTest', function(req, res) {
  parser('This is some sample text. This text can contain multiple sentences.');
  return res.send('/tagTest sent');
})

function sendMessage(msg) {
  requestCb({
    method: 'POST',
    uri: slackWebhookUrl,
    json: {
      text: msg
    }
  }, function(error, response, body) {
  });
}

app.listen(portNum, () => {
  if (!process.env.PORT) {
    console.log("Serving port number " + portNum);
  }
})


