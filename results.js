module.exports = {
  getResultsCsv: (results) => {
    const createResultsLine = function (result) {
      let output = result.Start + ",";
      output += result.End + ",";
      output += result.Total + ",";
      output += result.Opened + ",";
      output += result.Closed + ",";
      output += result.Churn + ",";
      output += result.AvgComments + ",";
      output += result.AvgDaysMerged + ",";
      output += result.AvgAgeWhenReviewed + ",";
      output += result.AvgFilesChanged;
      return output;
    };

    const header =
      "StartDate,EndDate,TotalOpen,Opened,Closed,AvgChurn,AvgComments,AvgDaysMerged,AvgAgeWhenReviewed,AvgFilesChanged\n";
    const formatted = results.map(createResultsLine);

    let prList = "";
    formatted.forEach((item) => {
      prList += item + "\n";
    });

    return header + prList;
  },
};
