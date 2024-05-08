module.exports = {
  getAllPullRequests: async (repos) => {
    const getFromCache = async function (owner, repo, prNumber) {
      const makeDirectory = function (path) {
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
      };

      const PR = require("./pr");
      const fs = require("fs");
      const Days = require("./days");
      const GraphQL = require("./graphql");

      const folderNameClosed = "prfiles/closed";
      const folderNameDate = "prfiles/" + Days.formatDate(new Date());

      makeDirectory("prfiles");
      makeDirectory(folderNameClosed);
      makeDirectory(folderNameDate);
      const fileName = repo + "-" + prNumber + ".json";

      let currentFileName = folderNameClosed + "/" + fileName;

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
    };

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
  },
};
