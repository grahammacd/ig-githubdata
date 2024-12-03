const GraphQL = require("./graphql");
const Repository = require("./repository");
const GetPRs = require("./getPRs");
const DataGenerator = require("./dataGenerator");

const organisation = "incentivegames";
const startDate = new Date(2021, 7, 1);
const incrementYears = 0;
const incrementMonths = 0;
const incrementDays = 7;
const users = ['Aramosgr', 'blair-mongan', 'Marki10', 'DavidGGibson', 'SRN-Dev', 'kb-ig', 'panosfil5', 'L3n1ad', 'MatthewGibson012', 'tompenn-ig', 'david-mcb-inc', 'JamesGardener', 'IGCraig', 'RokasAl', 'igor570', 'alasdairw-incentive', 'brandon-incentivegames', 'jiagraham', 'diegoatig', 'corrie-mcgregor', 'irene-antreou', 'jack-surman', 'cameron-mcbride-ig', 'alexnewhouse-ig', 'RyanIncentiveGames', 'christophercaleb', 'abigailrivera-ig', 'dalebaker-allan', 'mgurel-ig'];

const GenerateGithubData = async () => {
  const response = await GraphQL.qraphQlRepositories(organisation);
  const repos = response.data.data.organization.repositories.edges
    .filter(Repository.hasPR)
    .map(Repository.getRepositoryName);
  repos.forEach(Repository.populatePullRequests);

  const pullRequests = await GetPRs.getAllPullRequests(repos);

  users.forEach((u) => DataGenerator.generateUserData(pullRequests,u,DataGenerator.generateData,new Date(startDate),incrementYears,incrementMonths,incrementDays));
  DataGenerator.generateData(pullRequests,"allUsers",new Date(startDate),incrementYears,incrementMonths,incrementDays)
}

GenerateGithubData();
