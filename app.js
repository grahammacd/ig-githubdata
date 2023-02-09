const PullRequestAPI = require("./pull-requests");
const dayFunctions = require("./days");

const getRepo = function (repository) {
  const split = repository.split("/");
  return split[split.length - 1];
};

const mapToOutput = async function (item) {
  const repository = getRepo(item.repository_url);
  const pr = await PullRequestAPI.getPR(
    getRepo(item.repository_url),
    item.number
  );

  const commits = await PullRequestAPI.getCommits(
    getRepo(item.repository_url),
    item.number
  );

  const reviews = await PullRequestAPI.getReviews(
    getRepo(item.repository_url),
    item.number
  );

  const comments = await PullRequestAPI.getComments(
    getRepo(item.repository_url),
    item.number
  );

  const myItemObject = {
    Link: item.url,
    Repository: repository,
    Title: item.title,
    CreatedAt: new Date(item.created_at),
    UpdatedAt: new Date(item.updated_at),
    CreatedDays: dayFunctions.countDays(item.created_at),
    UpdatedDays: dayFunctions.countDays(item.updated_at),
    User: item.user.login,
    MergeableState: pr.data.mergeable_state,
    Reviewers: pr.data.requested_reviewers
      .map((item) => {
        return item.login;
      })
      .join("|"),
    Additions: pr.data.additions,
    Deletions: pr.data.deletions,
    ChangedFiles: pr.data.changed_files,
    Commits: commits.data.length,
    Reviews: reviews.data.length,
    Comments: comments.data.length
  };
  return myItemObject;
};

const createResultsLine = function (result) {
  let output = '"' + result.Link + '",';
  output += '"' + result.Repository + '",';
  output += '"' + result.Title + '",';
  output += result.CreatedAt + ",";
  output += result.UpdatedAt + ",";
  output += result.CreatedDays + ",";
  output += result.UpdatedDays + ",";
  output += '"' + result.User + '",';
  output += '"' + result.MergeableState + '",';
  output += '"' + result.Reviewers + '",';
  output += result.Additions + ",";
  output += result.Deletions + ",";
  output += result.ChangedFiles + ",";
  output += result.Commits + ",";
  output += result.Reviews + ",";
  output += result.Comments;

  return output;
};

const getResultsCsv = function (results) {
  const header =
    "Link,Repository,Title,Created_At,Updated_At,Created_Days,Updated_Days,Raised_By,Mergeable_State,Requested_Reviewers,Additions,Deletions,Changed_Files,Commits,Reviews,Comments\n";
  const formatted = results.map(createResultsLine);

  let prList = "";
  formatted.forEach((item) => {
    prList += item + "\n";
  });

  return header + prList;
};

const addLeadingZeros = function (n) {
  if (n <= 9) {
    return "0" + n;
  }
  return n;
};

const asyncApiCall = async () => {
  const response = await PullRequestAPI.searchPullRequests();
  const results = await Promise.all(response.data.items.filter((item) => item.user.login !== 'dependabot[bot]').map(mapToOutput));

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
    "prlist-" + todayString + ".csv",
    getResultsCsv(results),
    function (err) {
      if (err) return console.log(err);
      console.log("PR Results > prlist-" + todayString + ".csv");
    }
  );
};

asyncApiCall();
