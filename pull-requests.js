const axios = require("axios");
const BASE_URL = `https://api.github.com`;
const authentication = {
  username: "grahammacd",
  password: "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",
};

module.exports = {
  searchPullRequests: () =>
    axios({
      method: "GET",
      url:
        BASE_URL +
        `/search/issues?q=is:open+is:pr+archived:false+user:incentivegames&per_page=1000`,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
  getReviewers: (repository, pull) =>
    axios({
      method: "GET",
      url:
        BASE_URL +
        `/repos/incentivegames/` +
        repository +
        `/pulls/` +
        pull +
        `/requested_reviewers`,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
  getPR: (repository, pull) =>
    axios({
      method: "GET",
      url: BASE_URL + `/repos/incentivegames/` + repository + `/pulls/` + pull,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
  getCommits: (repository, pull) =>
    axios({
      method: "GET",
      url: BASE_URL + `/repos/incentivegames/` + repository + `/pulls/` + pull + `/commits`,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
    getComments: (repository, pull) =>
    axios({
      method: "GET",
      url: BASE_URL + `/repos/incentivegames/` + repository + `/pulls/` + pull + `/comments`,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
    getReviews: (repository, pull) =>
    axios({
      method: "GET",
      url: BASE_URL + `/repos/incentivegames/` + repository + `/pulls/` + pull + `/reviews`,
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      auth: authentication,
    }),
};
