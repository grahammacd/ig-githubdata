const GraphQL = require("./graphql");
const Days = require("./days");
const Maths = require("./maths");
const PR = require("./pr");
const Repository = require("./repository");
const Results = require("./results");
const GetPRs = require("./getPRs");

const organisation = "incentivegames";
const startDate = new Date(2022, 0, 1);
const incrementYears = 0;
const incrementMonths = 1;
const incrementDays = 0;

const GenerateGithubData = async () => {
  const response = await GraphQL.qraphQlRepositories(organisation);
  const repos = response.data.data.organization.repositories.edges
    .filter(Repository.hasPR)
    .map(Repository.getRepositoryName);
  repos.forEach(Repository.populatePullRequests);

  const pullRequests = await GetPRs.getAllPullRequests(repos);

  let start = startDate;
  let end = new Date(start);
  Days.incrementDate(end, incrementYears, incrementMonths, incrementDays);

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

    const averageChurn = Maths.getAverage(
      openPrs.map((pr) => pr.churn.ChurnNumber)
    );

    const totalOpened = openPrs.filter((item) => {
      return new Date(item.createdAtDate) > start;
    }).length;

    const totalClosed = openPrs.filter((item) => {
      return item.closed && new Date(item.closedAtDate) < end;
    }).length;

    const averageDaysMerged = Maths.getAverage(
      mergedPrsInRange.map((pr) => PR.ageInDaysWhenMerged(pr))
    );

    const averageAgeWhenReviewed = Maths.getAverage(
      reviewedPrs.map((pr) => PR.ageInHoursWhenReviewed(pr))
    );

    const averageComments = Maths.getAverage(
      openPrs.map((pr) => pr.comments.edges.length + pr.reviews.edges.length)
    );

    const averageFilesChanged = Maths.getMean(
      openPrs.map((pr) => pr.changedFiles)
    );

    allPrs.push({
      Start: Days.formatDate(start),
      End: Days.formatDate(end),
      Total: openPrs.length,
      Opened: totalOpened,
      Closed: totalClosed,
      Churn: averageChurn,
      AvgComments: averageComments,
      AvgDaysMerged: averageDaysMerged,
      AvgAgeWhenReviewed: averageAgeWhenReviewed,
      AvgFilesChanged: averageFilesChanged,
    });

    Days.incrementDate(start, incrementYears, incrementMonths, incrementDays);
    Days.incrementDate(end, incrementYears, incrementMonths, incrementDays);
  }

  const todayString = Days.formatDate(Date.now());

  let fs = require("fs");
  fs.writeFile(
    "prdata-" + todayString + ".csv",
    Results.getResultsCsv(allPrs),
    function (err) {
      if (err) return console.log(err);
      console.log("PR Results > prdata-" + todayString + ".csv");
    }
  );
};

GenerateGithubData();
