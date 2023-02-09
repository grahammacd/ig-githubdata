module.exports = {
  countDays: (date) => {
    const date_diff_indays = function (date1, date2) {
      const dt1 = new Date(date1);
      const dt2 = new Date(date2);
      return Math.floor(
        (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
          Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
          (1000 * 60 * 60 * 24)
      );
    };

    const myDate = new Date(date);
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    return date_diff_indays(myDate, today);
  },
};
