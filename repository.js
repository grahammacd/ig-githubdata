module.exports = {
  getRepositoryName: (repositoryItem) => {
    return {
      repository: repositoryItem.node.name,
      lastPullRequest: repositoryItem.node.pullRequests.edges[0].node.number,
      pullRequests: [],
    };
  },
  hasPR: (repositoryItem) => {
    return repositoryItem.node.pullRequests.edges.length > 0;
  },
  populatePullRequests: (repositoryItem, index, arr) => {
    repositoryItem.pullRequests = [];
    for (let i = 1; i <= repositoryItem.lastPullRequest; i++) {
      repositoryItem.pullRequests.push(i);
    }
  },
};
