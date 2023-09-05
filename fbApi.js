const axios = require('axios')
const config = require('./config')
const { MESSAGING_TYPES, MESSAGE_TEMPLATE_TYPES } = require('./contants')
const {queue} = require("async/index");

const BASE_URL = 'https://graph.facebook.com/v17.0'
const MESSAGES_URL = `${BASE_URL}/${config.FB_PAGE_ID}/messages?access_token=${config.FB_PAGE_TOKEN}`

const messages = async (messageObj) => {
  // console.log()
  // console.log()
  // console.log()
  // console.log()
  // console.log()
  // console.log('asdasdasd', messageObj)
  const response = await axios.post(MESSAGES_URL, messageObj)
  const { data } = response

  if (data.error) throw new Error(`Send API Request Failed ## Code (${data.error.constructor}) ##`)

  return data
}

const api = {
  // messages: async (messageObj) => {
  //   const response = await axios.post(MESSAGES_URL, messageObj)
  //   const { data } = response
  //   if (data.error) throw new Error(`Send API Request Failed ## Code (${data.error.constructor}) ##`)
  //   return
  // },
  waitFor: async (seconds) => {
    setTimeout(() => true, seconds * 1000);
  },
  fields: async (userId, fields) => {
    const url = `${BASE_URL}/${userId}`
    const response = await axios.get(url, {
      params: {
        access_token: config.FB_PAGE_TOKEN,
        fields
      }
    })

    return response.data
  },
  sendTextMessage: async (userId, message, { messagingType = MESSAGING_TYPES.RESPONSE, quickReplies } = {}) => {
    return messages({
      messagingType: messagingType,
      recipient: {
        id: userId
      },
      message: {
        text: message,
        quick_replies: quickReplies
      },
    })
  },
  sendAttachment: async ({
               userId,
               attachmentType,
               url,
               isReusable = true,
               messagingType = MESSAGING_TYPES.RESPONSE,
               quickReplies
             }) => {
    return messages({
      messaging_type: messagingType,
      recipient: {
        id: userId,
      },
      message: {
        attachment: {
          type: attachmentType,
          payload: {
            url,
            is_reusable: isReusable,
            quick_replies: quickReplies
          },
        },
      }
    })
  },
  sendMediaTemplate: async ({
    userId,
    mediaType,
    url,
    attachmentId,
    templateType = MESSAGE_TEMPLATE_TYPES.MEDIA
                            }) => {
    return messages({
      recipient: {
        id: userId,
      },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: templateType,
            elements: [
              url ? {
                  media_type: mediaType,
                  url
                } : {
                  media_type: mediaType,
                  attachment_id: attachmentId
                }
            ]
          }
        }
      }
    })
  },
  sendButtonsTemplate: async ({
    userId,
    text,
    buttons
                              }) => {
    return messages({
      recipient: {
        id: userId,
      },
      message: {
        attachment: {
          type: 'template',
          payload: {
            template_type: MESSAGE_TEMPLATE_TYPES.BUTTON,
            text,
            buttons
          }
        }
      }
    })
  },
  sendTypingOn: async (userId) => {
    return messages({
      recipient: {
        id: userId
      },
      sender_action: 'typing_on'
    })
  },
  sendTypingOff: async (userId) => {
    return messages({
      recipient: {
        id: userId
      },
      sender_action: 'typing_off'
    })
  },
}


// const isLastMessageInArray = (index, textMessagesArray) =>
//   index === textMessagesArray.length - 1;
//
// const sendTextMessage = async (
//   userPSID,
//   messageText,
//   { messagingType = MESSAGING_TYPES.RESPONSE, quickReplies } = {}
// ) => {
//   const messageObject = {
//     messaging_type: messagingType,
//     recipient: {
//       id: userPSID,
//     },
//     message: {
//       text: messageText,
//       quick_replies: quickReplies
//     },
//   };
//
//   return api.messages(messageObject);
// };

// const sendMultipleTextMessages = async (
//   userPSID,
//   textMessagesArray,
//   { messagingType = MESSAGING_TYPES.RESPONSE, quickReplies = [] } = {}
// ) => {
//   for (const [index, textMessage] of textMessagesArray.entries()) {
//     await sendTextMessage(userPSID, textMessage, {
//       messagingType,
//       quickReplies: isLastMessageInArray(index, textMessagesArray) ? quickReplies : undefined
//     });
//     if (!isLastMessageInArray(index, textMessagesArray)) {
//       await sendTypingOn(userPSID);
//       const secondsToWait = textMessage.split(' ').length / 5.0;
//       await waitFor(secondsToWait);
//     }
//   }
// }

module.exports = {
  // sendTextMessage,
  fbApi: api
}