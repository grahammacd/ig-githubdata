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
  return (
    item.node.pullRequests.edges.length > 0
  );
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

function isOpen(item, start, end){
  if(PR.isOpenRange(item, start, end)){
    return true;
  }
  else{
    return false;
  }
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

  let start = new Date(2022,4,29);
  let end = new Date(start);
  end.setDate(end.getDate() + 7);

  while(end < new Date()){
    const openPrs = pullRequests.filter((item) => { return isOpen(item,start,end); });
    console.log(start + " to " + end + " (" + openPrs.length + ")");
    start.setDate(start.getDate() + 7);
    end.setDate(end.getDate() + 7);
  }
};

GenerateGithubData();
