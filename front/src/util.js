
function diaplayTime(data) {
    let result = ''
    //将字符串转换成时间格式
    let timePublish = new Date(data);
    let timeNow = new Date();
    let minute = 1000 * 60;
    let hour = minute * 60;
    let day = hour * 24;
    let month = day * 30;
    let year = month * 12;
    let diffValue = timeNow - timePublish;
    let diffMonth = diffValue / month;
    let diffWeek = diffValue / (7 * day);
    let diffDay = diffValue / day;
    let diffHour = diffValue / hour;
    let diffMinute = diffValue / minute;
    let diffYear = diffValue / year;
    if (diffValue < minute) {
      result = "刚刚发表";
    } else if (diffYear > 1) {
      result = parseInt(diffYear) + "年前";
    } else if (diffMonth > 1) {
      result = parseInt(diffMonth) + "月前";
    } else if (diffWeek > 1) {
      result = parseInt(diffWeek) + "周前";
    } else if (diffDay > 1) {
      result = parseInt(diffDay) + "天前";
    } else if (diffHour > 1) {
      result = parseInt(diffHour) + "小时前";
    } else if (diffMinute > 1) {
      result = parseInt(diffMinute) + "分钟前";
    } else {
      result = "刚刚发表";
    }
    return result;
  };


  export { diaplayTime }