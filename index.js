'use strict';

const config = require('./config');
const { WEBHOOK_EVENT_TYPES, ATTACHMENT_TYPES, MESSAGING_TYPES} = require('./contants');
const bodyParser = require('body-parser');
const express = require('express');
// const Wit = require('node-wit').Wit;
const FB = require('./facebook.action');
const { fbApi } = require('./fbApi')
const { parseEvent } = require('./eventManager')

// Webserver parameter
const PORT = process.env.PORT || 8000;

// Messenger API parameters
if (!config.FB_PAGE_ID) {
    throw new Error('missing FB_PAGE_ID');
}
if (!config.FB_PAGE_TOKEN) {
    throw new Error('missing FB_PAGE_TOKEN');
}

// See the Webhook reference
// https://developers.facebook.com/docs/messenger-platform/webhook-reference
const getFirstMessagingEntry = (body) => {
    const val = body.object == 'page' &&
            body.entry &&
            Array.isArray(body.entry) &&
            body.entry.length > 0 &&
            body.entry[0] &&
            body.entry[0].id === config.FB_PAGE_ID &&
            body.entry[0].messaging &&
            Array.isArray(body.entry[0].messaging) &&
            body.entry[0].messaging.length > 0 &&
            body.entry[0].messaging[0]
        ;
    return val || null;
};

var sessions = {};
const findOrCreateSession = (sessions, fbid, cb) => {

    if (!sessions[fbid]) {
        console.log("New Session for:", fbid);
        sessions[fbid] = {context: {}};
    }

    cb(sessions, fbid);
};

const contexts = {}
const getOrCreateContext = (userId) => {
    return contexts[userId] ?? {}
}

const setContext = (userId, propName, value) => {
    const context = getOrCreateContext(userId)
    context[propName] = value
    contexts[userId] = context

    return context
}

const resetContext = (userId) => {
    contexts[userId] = {}
}

// Wit.ai bot specific code

// Import our bot actions and setting everything up
const actions = require('./wit.actions');
const e = require("express");
// const wit = new Wit(config.WIT_TOKEN, actions);

// Starting our webserver and putting it all together
const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());

// Webhook setup
// app.get('/', (req, res) => {
//     if (!config.FB_VERIFY_TOKEN) {
//         throw new Error('missing FB_VERIFY_TOKEN');
//     }
//     if (req.query['hub.mode'] === 'subscribe' &&
//       req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
//         res.send(req.query['hub.challenge']);
//     } else {
//         res.sendStatus(400);
//     }
// });

// Message handler
// app.post('/messenger', (req, res) => {
//     // Parsing the Messenger API response
//     const messaging = getFirstMessagingEntry(req.body);
//     if (messaging && messaging.recipient.id === config.FB_PAGE_ID) {
//         // Yay! We got a new message!
//
//         // We retrieve the Facebook user ID of the sender
//         const sender = messaging.sender.id;
//
//         // We retrieve the user's current session, or create one if it doesn't exist
//         // This is needed for our bot to figure out the conversation history
//         findOrCreateSession(sessions, sender, (sessions, sessionId) => {
//               // We retrieve the message content
//
//               //First do Postbacks -> then go with this context to wit.ai
//               async.series(
//                 [
//                     function (callback) {
//                         if (messaging.postback) {
//                             //POSTBACK
//                             const postback = messaging.postback;
//
//                             if (postback) {
//                                 var context = sessions[sessionId].context;
//                                 FB.handlePostback(sessionId, context, postback.payload, (context) => {
//                                     callback(null, context);
//                                 });
//                             }
//                         } else {
//                             callback(null, {});
//                         }
//                     },
//                     function (callback) {
//                         if (messaging.message) {
//                             //MESSAGE
//
//                             const msg = messaging.message.text;
//                             const atts = messaging.message.attachments;
//
//                             if (atts) {
//                                 // We received an attachment
//
//                                 // Let's reply with an automatic message
//                                 FB.sendText(
//                                   sender,
//                                   'Sorry I can only process text messages for now.'
//                                 );
//                                 callback(null, {});
//
//                             } else {
//
//                                 console.log("Run wit with context", sessions[sessionId].context);
//                                 // Let's forward the message to the Wit.ai Bot Engine
//                                 // This will run all actions until our bot has nothing left to do
//                                 wit.runActions(
//                                   sessionId, // the user's current session
//                                   msg, // the user's message
//                                   sessions[sessionId].context, // the user's current session state
//                                   (error, context) => {
//                                       if (error) {
//                                           console.log('Oops! Got an error from Wit:', error);
//                                       } else {
//                                           // Our bot did everything it has to do.
//                                           // Now it's waiting for further messages to proceed.
//                                           console.log('Waiting for futher messages.');
//
//                                           // Based on the session state, you might want to reset the session.
//                                           // This depends heavily on the business logic of your bot.
//                                           // Example:
//                                           // if (context['done']) {
//                                           //   delete sessions[sessionId];
//                                           // }
//
//                                           // Updating the user's current session state
//                                           callback(null, context);
//                                       }
//                                   }
//                                 );
//
//                             }
//                         } else {
//                             //delivery confirmation
//                             //mids etc
//
//                             callback(null, {});
//                         }
//                     },
//                 ],
//                 function (err, results) {
//
//                     /* var newContext = sessions[sessionId].context;
//                      console.log("Old context", newContext);
//                      for (let context_return of results) {
//
//                      newContext = newContext.concat(context_return);
//                      console.log("New after adding", context_return, newContext);
//                      }
//
//                      sessions[sessionId].context = newContext;*/
//
//                     console.log("Session context", sessions[sessionId].context);
//                 }
//               );
//           }
//         );
//     }
//     res.sendStatus(200);
// });

app.get('/messenger', (req, res) => {
    let mode = req.query["hub.mode"];
    let token = req.query["hub.verify_token"];
    let challenge = req.query["hub.challenge"]

    // Check if a token and mode is in the query string of the request
    if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === config.FB_VERIFY_TOKEN) {
            // Respond with the challenge token from the request
            console.log("WEBHOOK_VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
})

app.post('/messenger', (req, res) => {
    const data = req.body
    const { object, entry } = data

    if (object === 'page') {
        entry.forEach(async (entryEvent) => {
            try {
                const webhookEvent = entryEvent.messaging[0]
                const { sender, recipient, timestamp } = webhookEvent
                const event = parseEvent(webhookEvent)

                switch (event.eventType) {
                    case WEBHOOK_EVENT_TYPES.POSTBACK:

                        console.log('parsed event', event)

                        switch (event.postback.payload) {
                            case 'get_started':
                                // initialize context
                                resetContext(sender.id)

                                await fbApi.sendTypingOn(sender.id)

                                const { first_name } = await fbApi.fields(sender.id, 'first_name')

                                await fbApi.sendTextMessage(sender.id, `Hi ${first_name}! I'm happy to help you get started and build your fortune thru online.`)
                                await fbApi.waitFor(1)
                                await fbApi.sendTextMessage(sender.id, `May I ask some details for you to become part of the program. Where is your location?`)

                                await fbApi.sendTypingOff(sender.id)
                                break
                            case 'done_watching_last_video':
                                setContext(sender.id, 'dlq_video_done', true)

                                await fbApi.sendTypingOn(sender.id)
                                await fbApi.sendTextMessage(sender.id, `That is great. Please hang-on a while and I'll get you in touch with my team leader.`)
                                break
                        }

                        break
                    case WEBHOOK_EVENT_TYPES.MESSAGE:

                        console.log('parsed event', event)

                        if (event.isReplyToPreviousMessage) {
                            const context = getOrCreateContext(sender.id)
                            const reply = event.message.text

                            // no location yet so the previous message was probably the prompt for location
                            if (!context.location) {
                                setContext(sender.id, 'location', reply)

                                // console.log('context', contexts)

                                await fbApi.sendTextMessage(sender.id, 'What are you currently up to?')
                            } else if (!context.work) {
                                setContext(sender.id, 'work', reply)

                                await fbApi.sendTypingOn(sender.id)
                                await fbApi.sendAttachment({
                                    userId: sender.id,
                                    attachmentType: ATTACHMENT_TYPES.IMAGE,
                                    url: 'https://lh3.googleusercontent.com/drive-viewer/AITFw-zK7MhmWq_y3lAtaez2QmT4k-iihdkWkTiz7dblWpjNlCHwXZOtkQoYv1RDCXtgIb6HFd_tx8fGydX8qUjMkZl-O63K=w1920-h663',
                                })
                                await fbApi.sendTextMessage(sender.id, 'This is Pearl Hung!')
                                await fbApi.waitFor(1)
                                await fbApi.sendTextMessage(sender.id, 'I am the founder of Elites Empire, a powerful marketing team of an MLM Company called Aim Global. We have been in existence for a strong solid 17 years, starting in the Philippines and expanding worldwide.')
                                await fbApi.sendMediaTemplate({
                                    userId: sender.id,
                                    mediaType: ATTACHMENT_TYPES.VIDEO,
                                    url: 'https://www.facebook.com/100095497501091/videos/306607088565213'
                                })
                                await fbApi.sendTypingOn(sender.id)
                                await fbApi.sendTextMessage(sender.id, 'This is the team I have founded. Elites Empire. We are marketing both locals and international. You can be with us too.')
                                await fbApi.sendAttachment({
                                    userId: sender.id,
                                    attachmentType: ATTACHMENT_TYPES.IMAGE,
                                    url: 'https://lh3.googleusercontent.com/drive-viewer/AITFw-xMt7uB588nB8dcYKHZ6YZbMbZ-oE3t0iI8n8HzcisHcT97hmBIr1S-EEaKdjRRdJOzN-NkaVbUMyLBWh6q_uaEJLxaog=w1920-h631',
                                })
                                await fbApi.sendAttachment({
                                    userId: sender.id,
                                    attachmentType: ATTACHMENT_TYPES.IMAGE,
                                    url: 'https://lh3.googleusercontent.com/drive-viewer/AITFw-x2OWWzC3FCOJnMVROa9Wof_CrI2orv6TcBfQ3utOatRgGYB9rHaXz1CK5cUtQDoVp3pS9hs2-2UjJBO6jVuMmdgMMTpg=w1920-h631',
                                })
                                await fbApi.sendMediaTemplate({
                                    userId: sender.id,
                                    mediaType: ATTACHMENT_TYPES.VIDEO,
                                    url: 'https://www.facebook.com/100095497501091/videos/2102150146799330'
                                })
                                await fbApi.sendMediaTemplate({
                                    userId: sender.id,
                                    mediaType: ATTACHMENT_TYPES.VIDEO,
                                    url: 'https://www.facebook.com/100095497501091/videos/194739820103686'
                                })
                                await fbApi.sendButtonsTemplate({
                                    userId: sender.id,
                                    text: 'See how the bussiness work. Please signup here as you CLICK THE WATCH NOW HERE',
                                    buttons: [
                                        {
                                            type: 'web_url',
                                            url: 'https://elitesempire.com/digital-leverage-quest-registration-pearlhung/?referrer=PEARL%20HUNG',
                                            title: 'WATCH NOW'
                                        }
                                    ]
                                })
                                await fbApi.waitFor(5)
                                await fbApi.sendTypingOn(sender.id)
                                await fbApi.sendButtonsTemplate({
                                    userId: sender.id,
                                    text: "Are you done watching? Let's talk after and I'll have you assisted by my skillful team leader. You can do business video call to assist get you started.",
                                    buttons: [
                                        {
                                            type: 'postback',
                                            title: 'Done watching',
                                            payload: 'done_watching_last_video'
                                        }
                                    ]
                                })
                                await fbApi.sendTypingOff(sender.id)
                            }
                        }

                        break
                }


                res.status(200).send('EVENT_RECEIVED')
            } catch (error) {
                res.status(500).send()
            }
        })
    } else {
        res.sendStatus(404)
    }
})
