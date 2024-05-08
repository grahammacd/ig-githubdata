function getPrChurn(pr) {
  let result = [];
  pr.commits.edges.forEach((element) =>
    result.push({ Type: "C", Date: new Date(element.node.commit.authoredDate) })
  );
  pr.reviews.edges.forEach((element) =>
    result.push({ Type: "R", Date: new Date(element.node.createdAt) })
  );
  result.sort(function (a, b) {
    return a.Date - b.Date;
  });

  let iteration = 0;
  let onCommit = true;

  for (posn = 0; posn < result.length; posn++) {
    if (result[posn].Type === "R" && onCommit) {
      iteration++;
      onCommit = false;
    } else if (result[posn].Type === "C" && !onCommit) {
      onCommit = true;
    }
  }

  return { List: result, ChurnNumber: iteration };
}

function getPr(pr) {
  let myPr = pr.data.repository.pullRequest;
  myPr.createdAtDate = new Date(myPr.createdAt);

  if (myPr.merged) {
    myPr.mergedAtDate = new Date(myPr.mergedAt);
  }

  if (myPr.closed) {
    myPr.closedAtDate = new Date(myPr.closedAt);
  }

  myPr.churn = getPrChurn(myPr);

  return myPr;
}

function isOpen(pr, startDate, endDate) {

  let result;

  if (pr.closed) {
    result = (
      startDate < new Date(pr.closedAtDate) &&
      endDate > new Date(pr.createdAtDate)
    );
  } else {
    result = new Date(pr.createdAtDate) < startDate;
  }

  return result;
}

function ageInDaysWhenMerged(pr){
  const oneDay = 24 * 60 * 60 * 1000;
  if(pr.merged){
    const openedDate = new Date(pr.createdAtDate);
    const mergedDate = new Date(pr.mergedAtDate);
    return Math.round(Math.abs((mergedDate - openedDate) / oneDay));
  }
  else{
    return 0;
  }
}

function ageInHoursWhenReviewed(pr){
  const oneHour = 60 * 60 * 1000;
  if(pr.reviews.edges.length > 0){
    const openedDate = new Date(pr.createdAtDate);
    const firstReviewDate = new Date(pr.reviews.edges[0].node.createdAt);
    return Math.round(Math.abs((firstReviewDate - openedDate) / oneHour));
  }
  else{
    return 0;
  }
}

module.exports = {
  getPr: (pr) => getPr(pr),
  isOpenRange: (pr, startDate, endDate) => isOpen(pr, startDate, endDate),
  isOpen: (pr, date) => isOpen(pr, date, date),
  ageInDaysWhenMerged: (pr) => ageInDaysWhenMerged(pr),
  ageInHoursWhenReviewed: (pr) => ageInHoursWhenReviewed(pr)
};
