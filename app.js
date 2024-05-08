const GraphQL = require("./graphql");
const Days = require("./days");
const Maths = require("./maths");
const PR = require("./pr");
const Repository = require("./repository");
const Results = require("./results");
const GetPRs = require("./getPRs");

const GenerateGithubData = async () => {
  const response = await GraphQL.qraphQlRepositories("incentivegames");
  const repos = response.data.data.organization.repositories.edges
    .filter(Repository.hasPR)
    .map(Repository.getRepositoryName);
  repos.forEach(Repository.populatePullRequests);

  const pullRequests = await GetPRs.getAllPullRequests(repos);

  let start = new Date(2022, 0, 30);
  let end = new Date(start);
  end.setDate(end.getDate() + 7);

  let allPrs = [];

  while (start < new Date()) {
    const openPrs = pullRequests.filter((item) => {
      return PR.isOpenRange(item, start, end);
    });

    const mergedPrsInRange = pullRequests.filter((item) => {
      return (
        item.merged &&
        new Date(item.mergedAt) > start &&
        new Date(item.mergedAt) < end
      );
    });

    const reviewedPrs = openPrs.filter((item) => {
      return item.reviews.edges.length > 0;
    });

    const initialValue = 0;
    const totalChurn = openPrs.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.churn.ChurnNumber,
      initialValue
    );
    const totalOpened = openPrs.filter((item) => {
      return new Date(item.createdAtDate) > start;
    }).length;
    const totalClosed = openPrs.filter((item) => {
      return item.closed && new Date(item.closedAtDate) < end;
    }).length;
    const averageChurn = totalChurn / openPrs.length;

    const totalLengthMerged = mergedPrsInRange.reduce(
      (accumulator, currentValue) =>
        accumulator + PR.ageInDaysWhenMerged(currentValue),
      initialValue
    );

    const averageAgeWhenReviewed =
      reviewedPrs.reduce(
        (accumulator, currentValue) =>
          accumulator + PR.ageInHoursWhenReviewed(currentValue),
        initialValue
      ) / reviewedPrs.length;

    const averageComments =
      openPrs.reduce(
        (accumulator, currentValue) =>
          accumulator +
          currentValue.comments.edges.length +
          currentValue.reviews.edges.length,
        initialValue
      ) / openPrs.length;

    let averageDaysMerged = 0;
    if (mergedPrsInRange.length > 0) {
      averageDaysMerged = totalLengthMerged / mergedPrsInRange.length;
    }

    const averageFilesChanged =
      openPrs.reduce(
        (accumulator, currentValue) => accumulator + currentValue.changedFiles,
        initialValue
      ) / openPrs.length;

    const startDateString = Days.formatDate(start);
    const endDateString = Days.formatDate(end);

    allPrs.push({
      Start: startDateString,
      End: endDateString,
      Total: openPrs.length,
      Opened: totalOpened,
      Closed: totalClosed,
      Churn: averageChurn,
      AvgComments: averageComments,
      AvgDaysMerged: averageDaysMerged,
      AvgAgeWhenReviewed: averageAgeWhenReviewed,
      AvgFilesChanged: averageFilesChanged,
    });

    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  }

  const timeElapsed = Date.now();
  const today = new Date(timeElapsed);
  const todayString = Days.formatDate(today);

  let fs = require("fs");
  fs.writeFile(
    "prdata-" + todayString + ".csv",
    Results.getResultsCsv(allPrs),
    function (err) {
      if (err) return console.log(err);
      console.log("PR Results > prdata-" + todayString + ".csv");
    }
  );

  //Export stuff
  start = new Date(2023, 1, 12);
  end = new Date(start);
  end.setDate(end.getDate() + 7);
};

GenerateGithubData();
