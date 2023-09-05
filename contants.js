/** Webhook event constants */

const WEBHOOK_EVENT_TYPES = {
  MESSAGE: 'MESSAGE',
  REFERRAL: 'REFERRAL',
  POSTBACK: 'POSTBACK'
}

const MESSAGING_TYPES = {
  RESPONSE: 'RESPONSE',
  UPDATE: 'UPDATE',
  MESSAGE_TAG: 'MESSAGE_TAG',
};

const ATTACHMENT_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  FALLBACK: 'fallback', // Url Sent in a message
};

const MESSAGE_TEMPLATE_TYPES = {
  BUTTON: 'button',
  GENERIC: 'generic',
  MEDIA: 'media',
  RECEIPT: 'receipt',
  AIRLINE: {
    BOARDING_PASS: 'airline_boardingpass',
    CHECK_IN: 'airline_checkin',
    ITINERARY: 'airline_itinerary',
    UPDATE: 'airline_update',
  },
};

const BUTTON_TYPES = {
  WEB_URL: 'web_url',
  POSTBACK: 'postback',
  PHONE_NUMBER: 'phone_number',
  LOG_IN: 'account_link',
  LOG_OUT: 'account_unlink',
  GAME_PLAY: 'game_play',
  SHARE: 'element_share',
};


module.exports = {
  WEBHOOK_EVENT_TYPES,
  MESSAGING_TYPES,
  ATTACHMENT_TYPES,
  MESSAGE_TEMPLATE_TYPES,
  BUTTON_TYPES
};