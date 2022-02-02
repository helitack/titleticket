const core = require('@actions/core');
const github = require('@actions/github');
const conventionalCommitsConfig = require('conventional-changelog-conventionalcommits');
const parser = require('conventional-commits-parser').sync;

async function run() {
  try {
    const client = github.getOctokit(process.env.GITHUB_TOKEN);
    
    const contextPullRequest = github.context.payload.pull_request;
    if (!contextPullRequest) {
      throw new Error(
        "This action can only be invoked in `pull_request_target` or `pull_request` events. Otherwise the pull request can't be inferred."
      );
    }

    const owner = contextPullRequest.base.user.login;
    const repo = contextPullRequest.base.repo.name;

    const {data: pullRequest} = await client.pulls.get({
      owner,
      repo,
      pull_number: contextPullRequest.number
    });

    const originalTitle = pullRequest.title;
    const branchName = pullRequest.head.ref;
    const jiraTicketNumber = branchName.match(/\/[A-Z]{2,}-\d+/);

    if (!jiraTicketNumber || jiraTicketNumber.length !== 1 || !jiraTicketNumber[0]) {
      core.info(`No Jira ticket pattern found in branch: "${branchName}"`);
      return;
    }

    const jiraTicketString = `[${jiraTicketNumber[0].replace(/\//g, '')}]`;

    if (originalTitle.includes(jiraTicketString)) {
      core.info(`Title already includes the Jira ticket: "${jiraTicketString}"`);
      return;
    }

    const { parserOpts } = await conventionalCommitsConfig();
    const parserResult = parser(originalTitle, parserOpts);

    if (!parserResult.subject) {
      core.info(`No conventional commits subject found in title: "${originalTitle}"`);
      return;
    }

    const titleBeforeSubject = originalTitle.slice(0, originalTitle.indexOf(parserResult.subject));

    const newTitle = `${titleBeforeSubject}${jiraTicketString} ${parserResult.subject}`;

      await client.pulls.update({
        owner,
        repo,
        pull_number: contextPullRequest.number,
        title: newTitle,
      });
      core.info(`Successfully added the Jira ticket to the title!: "${newTitle}"`);
    
  } catch (error) {
    core.setFailed(error.message);
  }
}


run();