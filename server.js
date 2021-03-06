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
app.get('/', function(_req, res) {
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
      console.log(webhookEvent.postback)
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

    // Get the URL of the message attachment
    response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Please select a button?',
            'subtitle': 'Tap a button to answer.',
            'image_url': 'https://scontent.fmnl8-1.fna.fbcdn.net/v/t39.30808-6/288480150_101475515952037_7111218912266425825_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=09cbfe&_nc_ohc=Z8yO2ImK76oAX--3_-O&_nc_ht=scontent.fmnl8-1.fna&oh=00_AT_sDrSPVeIJbbhzuS02cqYqESsYdm6dibRV4R3YQiEULQ&oe=62B5964F',
            'buttons': [
              {
                'type': 'postback',
                'title': 'Schedule!',
                'payload': 'yes',
              },
              {
                'type': 'postback',
                'title': 'Locations',
                'payload': 'no',
              }
            ],
          }]
        }
      }
    };
  }

  // Send the response message
  callSendAPI(senderPsid, response);
}

// Handles messaging_postbacks events
function handlePostback(senderPsid, receivedPostback) {
  let response;

  // Get the payload for the postback
  let payload = receivedPostback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { 'text': 'Fuck rails!' };
  } else if (payload === 'no') {
    response = {
      'attachment': {
        'type': 'template',
        'payload': {
          'template_type': 'generic',
          'elements': [{
            'title': 'Please select a button?',
            'subtitle': 'Tap a button to answer.',
            'image_url': 'https://preview.redd.it/ilrnf174s7291.png?auto=webp&s=7b46a8c013080a4ed6ba995129fdc3babd4a7226',
            'buttons': [
              {
                'type': 'postback',
                'title': 'Branch 1!',
                'payload': 'Schedule1',
              },
            ],
          },
          {
            'title': 'Please select a button?',
            'subtitle': 'Tap a button to answer.',
            'image_url': 'https://preview.redd.it/ilrnf174s7291.png?auto=webp&s=7b46a8c013080a4ed6ba995129fdc3babd4a7226',
            'buttons': [
              {
                'type': 'postback',
                'title': 'Branch 2!',
                'payload': 'Schedule2',
              },
            ],
          }]
        }
      }
    }
    // Send the message to acknowledge the postback
  }else if(payload === 'Schedule1'){
    response = { 'text': 'https://goo.gl/maps/QaYsQ8QcANZaHcUh9' };
  }else if(payload === 'Schedule2'){
    response = { 'text': 'https://goo.gl/maps/XGYcpzcXneKgYkXh6' };
  }
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
