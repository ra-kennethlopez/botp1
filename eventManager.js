const {
  WEBHOOK_EVENT_TYPES
} = require("./contants");
const parseEvent = (event) => {
  if (event.message) return parseMessageEvent(event)
  if (event.postback) return parsePostbackEvent(event);
  if (event.referral) return parseReferralEvent(event);
}

const extractCommonAttributes = (event) => {
  return {
    userPSID: event.sender.id,
    userReference: event.sender.user_ref,
    sendingPageID: event.recipient.id,
    timestamp: event.timestamp,
  };
};

const parseMessageEvent = (event) => {
  const common = extractCommonAttributes(event)

  return {
    eventType: WEBHOOK_EVENT_TYPES.MESSAGE,
    ...common,
    isQuickReply: event.message.quick_reply != undefined,
    isReplyToPreviousMessage: (event.message.reply_to != undefined) || !(event.message.is_echo),
    hasAttachments: event.message.attachments != undefined,
    message: event.message,
  };
};

const parsePostbackEvent = (event) => {
  const common = extractCommonAttributes(event)

  return {
    eventType: WEBHOOK_EVENT_TYPES.POSTBACK,
    ...common,
    isReferred: event.postback.referral != undefined,
    postback: {
      title: event.postback.title,
      payload: event.postback.payload,
    },
    referral: event.postback.referral,
  };
};

const parseReferralEvent = (event) => {
  const common = extractCommonAttributes(event)

  return {
    eventType: WEBHOOK_EVENT_TYPES.REFERRAL,
    ...common,
    referral: event.referral,
  };
};

module.exports = {
  parseEvent
}