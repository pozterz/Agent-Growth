const moment = require("moment")
const thaiDate = (dateValue, showTime = false) => {
  let d = moment(dateValue)
  const thDay = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์"
  ]
  const thMonth = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม"
  ]
  if (dateValue) {
    let thaiDateFormat =
      thDay[moment(d).day()] +
      " ที่ " +
      moment(d).get("date") +
      " " +
      thMonth[moment(d).get("month")] +
      " " +
      (moment(d).get("year") + 543)
    if (showTime) {
      return (thaiDateFormat += " " + moment(d).format("HH:mm"))
    } else {
      return thaiDateFormat
    }
  }
}

module.exports = {
  thaiDate
}