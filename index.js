const functions = require("firebase-functions")
const core = require("./components/core")
const message = require("./components/message")

exports.AgentGrowth = functions.https.onRequest((req, res) => {
  if (req.body.events[0].type === "join") {
    let source = req.body.events[0].source
    core.saveGroupId(source)
    return res.send("OK")
  }
  if (req.body.events[0].type === "leave") {
    let source = req.body.events[0].source
    core.removeGroupId(source)
    return res.send("OK")
  }
  if (req.body.events[0].message.type !== "text") {
    return res.send("OK")
  }

  let reply_token = req.body.events[0].replyToken
  let msgSource = req.body.events[0].source
  let msg = req.body.events[0].message.text

  console.log(
    msg,
    /ยกเลิกวันคอมโบ วันที่ /g.test(msg),
    /ยกเลิกนัดคอมโบ วันที่ /g.test(msg)
  )

  if (
    [
      "คอมโบวันไหน",
      "วันคอมโบ",
      "combo วันไหน",
      "Combo วันไหน",
      "COMBO วันไหน"
    ].indexOf(msg) > -1
  ) {
    core.getComboDate(reply_token)
    return res.send("OK")
  } else if (
    /นัดคอมโบ วันที่ /g.test(msg) ||
    /นัดคอมโบวันที่ /g.test(msg) ||
    /กำหนดวันคอมโบวันที่ /g.test(msg) ||
    /กำหนดวันคอมโบ วันที่ /g.test(msg)
  ) {
    core
      .isAdmin(msgSource)
      .then(querySnapshot => {
        console.log(querySnapshot)
        if (querySnapshot.size) {
          console.log("u r admin")
          core.initComboDate(reply_token, msg)
        }
        return res.send("OK")
      })
      .catch(err => {
        console.log(err)
      })
  } else if (
    /ยกเลิกวันคอมโบ วันที่ /g.test(msg) ||
    /ยกเลิกวันคอมโบวันที่ /g.test(msg) ||
    /ยกเลิกนัดคอมโบ วันที่ /g.test(msg) ||
    /ยกเลิกนัดคอมโบวันที่ /g.test(msg)
  ) {
    core
      .isAdmin(msgSource)
      .then(querySnapshot => {
        console.log(querySnapshot)
        if (querySnapshot.size) {
          console.log("u r admin")
          core.removeComboDate(reply_token, msg)
        }
        return res.send("OK")
      })
      .catch(err => {
        console.log(err)
      })
  } else if (/เพิ่มแอดมิน /g.test(msg)) {
    core
      .isAdmin(msgSource)
      .then(querySnapshot => {
        if (querySnapshot.size) {
          core.addAdmin(msg)
        }
        return res.send("OK")
      })
      .catch(err => {
        console.log(err)
      })
  } else if (msg === "ดึง userId") {
    core.getUserId(reply_token, msgSource)
    return res.send("OK")
  }
})

exports.checkComboDate = functions.https.onRequest((req, res) => {
  core
    .checkComboDate()
    .then(() => {
      return res.send("OK")
    })
    .catch(err => {
      console.log(err)
    })
})

exports.scheduledFunction = functions.pubsub.schedule("every tue 10:30").timeZone('Asia/Bangkok').onRun(async (context) => {
  const weeklyIDResponse = await core.getWeeklyID()
  const weeklyObj = JSON.parse(weeklyIDResponse)
  const weeklyUrl = weeklyObj[0].shortUrl

  core.saveWeeklyFocusId(weeklyObj[0].id)

  let msg = `วันนี้วันอังคารแล้ว เขียน weekly focus กันเถอะ 🎉🎉🎉\n${weeklyUrl}`

  return message.push("C360124b5c1cfc907a702b9314337ac7b", msg);
});

exports.scheduledEndFunction = functions.pubsub.schedule("every fri 16:30").timeZone('Asia/Bangkok').onRun(async (context) => {
  // const weeklyIDResponse = await core.getWeeklyID()
  // console.log('weeklyIDResponse = ' + weeklyIDResponse)
  // const weeklyObj = JSON.parse(weeklyIDResponse)
  // const weeklyID = weeklyObj[0].id
  const weeklyID = await core.getWeeklyFocusId()
  const checklists = await core.getCardCheckList(weeklyID)
  // console.log('checklists = ' + checklists)

  var listName = 'วันศุกร์แล้ววววว weekly focus\n'
  const nameObject = JSON.parse(checklists)
  for (var i = 0; i < nameObject.length; i++) {
    var noPass = 0
    const items = nameObject[i].checkItems
    for (var j = 0; j < items.length; j++) {
      if (items[j].state == 'complete') {
        noPass++
      }
    }
    const percent = parseInt((noPass / items.length) * 100)
    listName += nameObject[i].name + " ผ่านแล้ว " + percent + "%\n"
  }
  console.log(listName)
  return message.push("C360124b5c1cfc907a702b9314337ac7b", listName);
});