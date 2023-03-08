const axios = require("axios");
const BASE_URL = `https://api.github.com`;
const authentication = {
  username: "grahammacd",
  password: "INSERT",
};

const graphql_query_pr = 'query($owner:String!,$repo:String!,$prNumber:Int!){repository(owner:$owner,name:$repo){name pullRequest(number:$prNumber){number additions deletions changedFiles createdAt merged mergedAt closed closedAt author{login}timelineItems{totalCount}commits(first:100){edges{node{commit{authoredDate}}}}reviews(first:100){edges{node{createdAt commit{authoredDate}}}}comments(first:100){edges{node{author{login}}}}}}}';
const graphql_query_repos = 'query($login:String!){organization(login:$login){repositories(first:100){edges{node{name pullRequests(last:1){edges{node{number}}}}}}}}'

async function CallGraphQl(query, variables){
  const graphQl = {query:query, variables:variables};
  const response = await axios({
    method: "POST",
    url:
      BASE_URL +
      `/graphql`,
    data:graphQl,
    auth: authentication,
  });

  return response;
}

async function call_qraphQlRepositories (login){
  const variables = {login: login};
  return await CallGraphQl(graphql_query_repos, variables);
}


async function call_qraphQlPullRequest (owner, repo, prNumber){
  const variables = {owner: owner, repo: repo, prNumber:prNumber};
  return await CallGraphQl(graphql_query_pr, variables);
}

module.exports = {
  qraphQlRepositories: (login) => call_qraphQlRepositories(login),
  qraphQlPullRequest: (owner, repo, prNumber) => call_qraphQlPullRequest(owner, repo, prNumber),
};
