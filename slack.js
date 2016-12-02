const Slack = require('slack');

module.exports = function( TOKEN, CHANNEL, ICON_EMOJI, USERNAME ) {
  return {
    notify: function (message, attachments, callback) {
      if (!callback) {
        callback = function(){};
      }
      Slack.chat.postMessage({
        token: TOKEN,
        channel: CHANNEL,
        text: message,
        attachments: attachments,
        as_user: false,
        icon_emoji: ICON_EMOJI,
        username: USERNAME
      }, function(err, response){
        console.log('-err-------');
        console.log(err);
        console.log(response);
      });
    }
  };
};
