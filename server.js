'use strict';

// Use dotenv to read .env vars into Node
require('dotenv').config();

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  { urlencoded, json } = require('body-parser'),
  app = express();

// Parse application/x-www-form-urlencoded
app.use(urlencoded({ extended: true }));

// Parse application/json
app.use(json());

// Respond with 'Hello World' when a GET request is made to the homepage
app.get('/', function (_req, res) {
  res.send('Hello World');
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for your webhook
app.post('/webhook', (req, res) => {
  let body = req.body;

  // Checks if this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      // Get the sender PSID
      let senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {

    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Handles messages events
function handleMessage(senderPsid, receivedMessage) {
  let response;

  // Checks if the message contains text
  if (receivedMessage.text) {
    // Create the payload for a basic text message, which
    // will be added to the body of your request to the Send API
    // response = {
    //   'text': `You sent the message: '${receivedMessage.text}'. Now send me an attachment!`
    // };
      response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Please select',
            'subtitle': 'Tap a button to answer.',
            'image_url': 'https://scontent.fmnl8-1.fna.fbcdn.net/v/t39.30808-6/288480150_101475515952037_7111218912266425825_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=Z8yO2ImK76oAX--3_-O&_nc_ht=scontent.fmnl8-1.fna&oh=00_AT_sDrSPVeIJbbhzuS02cqYqESsYdm6dibRV4R3YQiEULQ&oe=62B5964F',
            'buttons': [
              {
                'type': 'postback',
                'title': 'Schedule an appointment.',
                'payload': 'Schedule',
              },
              {
                'type': 'postback',
                'title': 'Show branches',
                'payload': 'Branch',
              }
            ],
          }]
        }
      }
    }
  }

  // } else if (receivedMessage.attachments) {
  //
  //   // Get the URL of the message attachment
  //   let attachmentUrl = receivedMessage.attachments[0].payload.url;
  //   response = {
  //     'attachment': {
  //       'type': 'template',
  //       'payload': {
  //         'template_type': 'generic',
  //         'elements': [{
  //           'title': 'Is this the right picture?',
  //           'subtitle': 'Tap a button to answer.',
  //           'image_url': attachmentUrl,
  //           'buttons': [
  //             {
  //               'type': 'postback',
  //               'title': 'Yes!',
  //               'payload': 'yes',
  //             },
  //             {
  //               'type': 'postback',
  //               'title': 'No!',
  //               'payload': 'no',
  //             }
  //           ],
  //         }]
  //       }
  //     }
  //   };
  // }

  // Send the response message
  callSendAPI(senderPsid, response);
}

// Handles messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  let payload = receivedPostback.payload;

  // Set the response based on the postback payload
  if (payload === 'Schedule') {
    response = { 'text': 'click this link bitch!' };
  } else if (payload === 'Branch') {
    response = { 'text': `Here's our branches` };
  }
  // Send the message to acknowledge the postback
  callSendAPI(senderPsid, response);
}

// Sends response messages via the Send API
function callSendAPI(senderPsid, response) {

  // The page access token we have generated in your app settings
  const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // Construct the message body
  let requestBody = {
    'recipient': {
      'id': senderPsid
    },
    'message': response
  };

  // Send the HTTP request to the Messenger Platform
  request({
    'uri': 'https://graph.facebook.com/v2.6/me/messages',
    'qs': { 'access_token': PAGE_ACCESS_TOKEN },
    'method': 'POST',
    'json': requestBody
  }, (err, _res, _body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
