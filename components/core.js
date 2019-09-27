const firebase = require("firebase-admin")
var serviceAccount = require("../agent-growth-firebase-adminsdk-7hdow-d56b202efd.json")
const message = require("./message")
const utils = require("./utils")
const moment = require("moment")
const request = require('request-promise');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://agent-growth.firebaseio.com/"
})

const DATEFORMAT = "YYYY-MM-DD"
const DISPLAYFORMAT = "DD-MM-YYYY"

const saveGroupId = source => {
  const { roomId, groupId, type } = source
  let data = {
    [type === "group" ? "groupId" : "roomId"]:
      type === "group" ? groupId : roomId,
    type
  }

  return firebase
    .firestore()
    .collection("groups")
    .where(
      type === "group" ? "groupId" : "roomId",
      "=",
      type === "group" ? groupId : roomId
    )
    .get()
    .then(querySnapshot => {
      if (!querySnapshot.size) {
        return firebase
          .firestore()
          .collection("groups")
          .add(data)
          .then(docRef => {
            console.log("groups added: ", docRef.id)
            return
          })
          .catch(error => {
            console.error("Error adding document: ", error)
          })
      }
      return
    })
    .catch(err => {
      console.log(err)
    })
}

const removeGroupId = source => {
  const { roomId, groupId, type } = source
  console.log(
    "removing group",
    type === "group" ? "groupId" : "roomId",
    type === "group" ? groupId : roomId
  )

  return firebase
    .firestore()
    .collection("groups")
    .where(
      type === "group" ? "groupId" : "roomId",
      "=",
      type === "group" ? groupId : roomId
    )
    .get()
    .then(querySnapshot => {
      if (querySnapshot.size) {
        querySnapshot.forEach(doc => {
          doc.ref.delete()
        })
      }
      return
    })
    .catch(err => {
      console.log(err)
    })
}

const broadcastToGroups = msg => {
  return firebase
    .firestore()
    .collection("groups")
    .get()
    .then(querySnapshot => {
      if (querySnapshot.size) {
        querySnapshot.forEach(doc => {
          if (doc.data()) {
            const { roomId, groupId, type } = doc.data()
            if (groupId || roomId) {
              return message.push(type === "group" ? groupId : roomId, msg)
            }
          }
        })
      }
      return
    })
    .catch(err => {
      console.log(err)
    })
}

const getComboDate = reply_token => {
  const today = moment().format(DATEFORMAT)
  return firebase
    .firestore()
    .collection("combo_date")
    .where("date", ">=", today)
    .orderBy("date")
    .get()
    .then(querySnapshot => {
      if (querySnapshot.size) {
        let res = "\uDBC0\uDCB2 วันนัดคอมโบนะคร้าบบบบบ \uDBC0\uDCB2\n\n"
        querySnapshot.forEach(doc => {
          if (doc.data()) {
            const { date } = doc.data()
            res += "\uDBC0\uDCA4" + utils.thaiDate(date) + "\n"
          }
        })

        res +=
          "\n\nเดี๋ยวทุกๆก่อนวันคอมโบจะมีแจ้งเตือนไปตอนสองทุ่มของทุกวันนะครับ \uDBC0\uDC8D"
        return message.reply(reply_token, res)
      } else {
        let res = "ยังไม่มีตารางนัดคอมโบเลยจ้า \uDBC0\uDC9B"
        return message.reply(reply_token, res)
      }
    })
    .catch(err => {
      console.log(err)
    })
}

const initComboDate = (reply_token, msg) => {
  const splitDate = msg.split("วันที่ ")
  if (splitDate.length > 1 && moment(splitDate[1], DISPLAYFORMAT).isValid()) {
    const date = splitDate[1]
    console.log("initialze combo date", date)

    firebase
      .firestore()
      .collection("combo_date")
      .where("date", "=", moment(date, DISPLAYFORMAT).format(DATEFORMAT))
      .get()
      .then(querySnapshot => {
        if (querySnapshot.size) {
          // existed
          return message.reply(
            reply_token,
            `วัน ${utils.thaiDate(
              moment(date, DISPLAYFORMAT)
            )} มีนัดคอมโบไปแล้วจ้า`
          )
        } else {
          // not existed
          // add new record
          firebase
            .firestore()
            .collection("combo_date")
            .add({
              date: moment(date, DISPLAYFORMAT).format(DATEFORMAT)
            })

          const msg = `นัดคอมโบวัน ${utils.thaiDate(
            moment(date, DISPLAYFORMAT)
          )} นะคร้าบบบบบบบ \uDBC0\uDC35\uDBC0\uDC35`
          message.broadcast(msg)
          // broadcast to all saved groups
          return broadcastToGroups(msg)
        }
      })
      .catch(err => {
        console.log(err)
      })
  } else {
    console.log("cannot split combo date")
    return message.reply(
      reply_token,
      'ตัดวันไม่เจออะ พิมพ์มาแบบนี้ได้ปะ "นัดคอมโบ วันที่ 20/09/2019"'
    )
  }
}

const removeComboDate = (reply_token, msg) => {
  const splitDate = msg.split("วันที่ ")
  console.log('splitDate', splitDate);
  if (splitDate.length > 1 && moment(splitDate[1], DISPLAYFORMAT).isValid()) {
    console.log("removing combo date")
    const date = moment(splitDate[1], DISPLAYFORMAT)

    firebase
      .firestore()
      .collection("combo_date")
      .where("date", "=", date.format(DATEFORMAT))
      .get()
      .then(querySnapshot => {
        if (querySnapshot.size) {
          querySnapshot.forEach(doc => {
            doc.ref.delete()
          })

          const msg = `ยกเลิกนัดคอมโบวัน ${utils.thaiDate(
            moment(date, DISPLAYFORMAT)
          )} นะคร้าบบบบบบบ \uDBC0\uDC31`

          message.broadcast(msg)
          return broadcastToGroups(msg)
        }
        return
      })
      .catch(err => {
        console.log(err)
      })
  } else {
    console.log("cannot split combo date")
    return message.reply(
      reply_token,
      'ตัดวันไม่เจออะ พิมพ์มาแบบนี้ได้ปะ "นัดคอมโบ วันที่ 20/09/2019"'
    )
  }
}

const checkComboDate = () => {
  const today = moment()
    .add(1, "day")
    .format(DATEFORMAT)

  console.log("checking date :", today)

  return firebase
    .firestore()
    .collection("combo_date")
    .where("date", "=", today)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.size) {
        console.log("found combo date for ", today)
        let msg = `พรุ่งนี้มีนัดคอมโบนะคร้าบบบ อย่ามาสายนะ อยากเจอ \uDBC0\uDC37`
        message.broadcast(msg)
        return broadcastToGroups(msg)
      }
      console.log("not found combo for ", today)
      return Promise.resolve()
    })
    .catch(err => {
      console.log(err)
    })
}

const isAdmin = msgSource => {
  const { userId } = msgSource
  if (userId) {
    return firebase
      .firestore()
      .collection("admin")
      .where("userId", "=", userId)
      .get()
  }
  return Promise.resolve({ size: 0 })
}

const addAdmin = msg => {
  const splitMsg = msg.split("เพิ่มแอดมิน ")
  if (splitMsg.length > 1 && splitMsg[1] !== "") {
    const userId = splitMsg[1]
    firebase
      .firestore()
      .collection("admin")
      .add({
        userId
      })

    let msg = `ยินดีด้วย คุณได้รับการแต่งตั้งเป็นผู้ดูแล สามารถใช้คำสั่งได้ดังนี้\n
      นัดคอมโบ วันที่ DD/MM/YYYY\n
      กำหนดวันคอมโบ วันที่ DD/MM/YYYY\n
      ยกเลิกวันคอมโบ วันที่ DD/MM/YYYY\n
    `

    return message.push([userId], msg)
  }
}

const removeAdmin = source => {
  const { userId } = source
  return firebase
    .firestore()
    .collection("admin")
    .where("userId", "=", userId)
    .get()
    .then(querySnapshot => {
      if (querySnapshot.size) {
        querySnapshot.forEach(doc => {
          doc.ref.delete()
        })
      }
      return
    })
    .catch(err => {
      console.log(err)
    })
}

const getUserId = (reply_token, source) => {
  const { userId } = source
  if (userId) {
    return message.reply(reply_token, userId)
  }
}

async function getWeeklyID() {
  const options = {
    url: 'https://api.trello.com/1/boards/5bbac3a9f80c3e73b4ba2e05/cards/?limit=1&fields=name&key=705ca72daa4188bb16d5cbf5341f7881&token=3a76a5f606ffb4db4371ee1a59a27f7adbbcce8c8bb30f0469c21be1faed1643',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
    }
  };

  return new Promise(function (resolve, reject) {
    request.get(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}

async function getCardCheckList(weeklyID) {
  const options = {
    url: `https://api.trello.com/1/cards/${weeklyID}/checklists?fields=all&key=705ca72daa4188bb16d5cbf5341f7881&token=3a76a5f606ffb4db4371ee1a59a27f7adbbcce8c8bb30f0469c21be1faed1643`,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Charset': 'utf-8',
    }
  };

  return new Promise(function (resolve, reject) {
    request.get(options, function (err, resp, body) {
      if (err) {
        reject(err);
      } else {
        resolve(body);
      }
    })
  })
}

module.exports = {
  saveGroupId,
  removeGroupId,
  getComboDate,
  initComboDate,
  removeComboDate,
  checkComboDate,
  removeAdmin,
  addAdmin,
  isAdmin,
  getUserId,
  getWeeklyID,
  getCardCheckList
}
