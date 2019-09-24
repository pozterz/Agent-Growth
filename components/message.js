const request = require("request-promise")
const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message"
const LINE_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer <APIKEY>`
}

const reply = (reply_token, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/reply`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      replyToken: reply_token,
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  })
}

const push = (to, msg) => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/push`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      to,
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  })
}

const broadcast = msg => {
  return request({
    method: `POST`,
    uri: `${LINE_MESSAGING_API}/broadcast`,
    headers: LINE_HEADER,
    body: JSON.stringify({
      messages: [
        {
          type: `text`,
          text: msg
        }
      ]
    })
  })
}

module.exports = {
  reply,
  push,
  broadcast
}
