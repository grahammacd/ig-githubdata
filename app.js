const { Console } = require("console");
const { setDefaultResultOrder } = require("dns");
const GraphQL = require("./graphql");
const PR = require("./pr");

function formatDate(date) {
  const d = new Date(date);
  let month = "" + (d.getMonth() + 1),
    day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

function getRepositoryName(item) {
  return {
    repository: item.node.name,
    lastPullRequest: item.node.pullRequests.edges[0].node.number,
    pullRequests: [],
  };
}

function hasPR(item) {
  return item.node.pullRequests.edges.length > 0;
}

function populatePullRequests(currentValue, index, arr) {
  currentValue.pullRequests = [];
  for (let i = 1; i <= currentValue.lastPullRequest; i++) {
    currentValue.pullRequests.push(i);
  }
}

function makeDirectory(path) {
  const fs = require("fs");

  fs.access(path, (error) => {
    // To check if the given directory
    // already exists or not
    if (error) {
      // If current directory does not exist
      // then create it
      fs.mkdir(path, (error) => {
        if (error) {
          console.log(error);
        }
      });
    }
  });
}

async function getFromCache(owner, repo, prNumber) {
  const folderNameClosed = "prfiles/closed";
  const folderNameDate = "prfiles/" + formatDate(new Date());

  makeDirectory("prfiles");
  makeDirectory(folderNameClosed);
  makeDirectory(folderNameDate);
  const fileName = repo + "-" + prNumber + ".json";

  let currentFileName = folderNameClosed + "/" + fileName;

  let fs = require("fs");

  let needsData = true;
  let data;

  await new Promise((resolve, reject) => {
    fs.open(currentFileName, function (err, f) {
      if (err) {
        reject("file does not exist");
      } else {
        resolve("file exists");
        fs.close(f);
      }
    });
  })
    .then(() => {
      needsData = false;
    })
    .catch(() => {});

  if (needsData) {
    currentFileName = folderNameDate + "/" + fileName;
  }

  await new Promise((resolve, reject) => {
    fs.open(currentFileName, function (err, f) {
      if (err) {
        reject("file does not exist");
      } else {
        resolve("file exists");
        fs.close(f);
      }
    });
  })
    .then(() => {
      needsData = false;
    })
    .catch(() => {});

  if (needsData) {
    data = await GraphQL.qraphQlPullRequest(owner, repo, prNumber);
    data = data.data;
    if (data.data.repository.pullRequest) {
      const pr = PR.getPr(data);
      if (pr.closed) {
        currentFileName = folderNameClosed + "/" + fileName;
      }
      fs.writeFileSync(currentFileName, JSON.stringify(pr));
    } else {
      data = null;
    }
  } else {
    const dataString = fs.readFileSync(currentFileName);
    data = JSON.parse(dataString);
  }

  return data;
}

async function GetAllPullRequests(repos) {
  let prs = [];

  for (let r of repos) {
    console.log("Loading repository: " + r.repository);
    for (let p = 1; p <= r.pullRequests.length; p++) {
      const pr = await getFromCache("incentivegames", r.repository, p);
      if (pr) {
        prs.push(pr);
      }
    }
  }

  return prs;
}

function isOpen(item, start, end) {
  return PR.isOpenRange(item, start, end);
}

const addLeadingZeros = function (n) {
  if (n <= 9) {
    return "0" + n;
  }
  return n;
};

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


function getResultsCsv(results){
  const header =
    "StartDate,EndDate,TotalOpen,Opened,Closed,AvgChurn,AvgComments,AvgDaysMerged,AvgAgeWhenReviewed,AvgFilesChanged\n";
  const formatted = results.map(createResultsLine);

  let prList = "";
  formatted.forEach((item) => {
    prList += item + "\n";
  });

  return header + prList;
}


const GenerateGithubData = async () => {
  // 1: Get al repos
  // 2: for each repo get a list of PR ids
  // 3: get each PR

  const response = await GraphQL.qraphQlRepositories("incentivegames");
  const repos = response.data.data.organization.repositories.edges
    .filter(hasPR)
    .map(getRepositoryName);
  repos.forEach(populatePullRequests);
  const pullRequests = await GetAllPullRequests(repos);

  let start = new Date(2020, 11, 27);
  let end = new Date(start);
  end.setDate(end.getDate() + 7);

  let allPrs = [];

  while (start < new Date()) {
    const openPrs = pullRequests.filter((item) => {
      return isOpen(item, start, end);
    });

    const mergedPrsInRange = pullRequests.filter((item) => {
      return item.merged && new Date(item.mergedAt) > start && new Date(item.mergedAt) < end
    });

    const reviewedPrs = openPrs.filter((item) => {
      return item.reviews.edges.length > 0;
    })

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

    const averageAgeWhenReviewed = reviewedPrs.reduce(
      (accumulator, currentValue) =>
        accumulator + PR.ageInHoursWhenReviewed(currentValue),
      initialValue
    ) / reviewedPrs.length;


    const averageComments = openPrs.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.comments.edges.length + currentValue.reviews.edges.length,
      initialValue
    ) / openPrs.length;


    let averageDaysMerged = 0;
    if(mergedPrsInRange.length > 0){
      averageDaysMerged = totalLengthMerged / mergedPrsInRange.length;
    }

    const averageFilesChanged = openPrs.reduce(
      (accumulator, currentValue) =>
        accumulator + currentValue.changedFiles,
      initialValue
    ) / openPrs.length;

    const startDateString = start.getFullYear() +    "-" +    addLeadingZeros(start.getMonth() + 1) +    "-" +    addLeadingZeros(start.getDate());
    const endDateString = end.getFullYear() +    "-" +    addLeadingZeros(end.getMonth() + 1) +    "-" +    addLeadingZeros(end.getDate());

    allPrs.push({"Start":startDateString, "End":endDateString, "Total":openPrs.length, "Opened":totalOpened, "Closed":totalClosed, "Churn":averageChurn, "AvgComments":averageComments, "AvgDaysMerged":averageDaysMerged, "AvgAgeWhenReviewed":averageAgeWhenReviewed,"AvgFilesChanged":averageFilesChanged});

    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  }

const timeElapsed = Date.now();
const today = new Date(timeElapsed);
const todayString =
  today.getFullYear() +
  "-" +
  addLeadingZeros(today.getMonth() + 1) +
  "-" +
  addLeadingZeros(today.getDate());

let fs = require("fs");
fs.writeFile(
  "prdata-" + todayString + ".csv",
  getResultsCsv(allPrs),
  function (err) {
    if (err) return console.log(err);
    console.log("PR Results > prlist-" + todayString + ".csv");
  }
);



};

GenerateGithubData();
