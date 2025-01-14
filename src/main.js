import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import 'dotenv/config';

import GitHubService from './GithubService.js';
import BitbucketService from './BitbucketService.js';
import OpenAIService from './OpenAIService.js';
import CodeAnalyzer from './CodeAnalyzer.js';
import { getVersion } from './utils.js';

const program = new Command();

program
  .name('PR Review AI')
  .description('PR Reviewer using openAI')
  .version(getVersion());

program
  .requiredOption('--pull-request-id <number>', 'Pull request ID')
  .requiredOption('--repo <string>', 'Repository name (e.g., user/repo)')
  .requiredOption('--repo-provider <string>', 'Repository provider: Github / Bitbucket')
  .requiredOption('--openai-api-key <string>', 'Open AI API key')
  .option('--github-owner <string>', 'Github owner')
  .option('--github-token <string>', 'Github token')
  .option('--bitbucket-workspace <string>', 'Bitbucket workspace')
  .option('--bitbucket-token <string>', 'Bitbucket token')
  .action(async (options) => {
    console.log(chalk.blue(figlet.textSync('pr code review', { horizontalLayout: 'full' })));
    console.log(chalk.yellow('VERSION: ', getVersion()));

    const { pullRequestId, repo, openaiApiKey, githubToken, githubOwner, repoProvider, bitbucketWorkspace, bitbucketToken } = options;
    console.log('options', options);

    const OPENAI_API_KEY = openaiApiKey || process.env.OPENAI_API_KEY;
    
    const REPO_PROVIDER = repoProvider || process.env.REPO_PROVIDER;
    
    const GITHUB_TOKEN = githubToken || process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = githubOwner || process.env.GITHUB_OWNER;

    const BITBUCKET_TOKEN = bitbucketToken || process.env.BITBUCKET_TOKEN;
    const BITBUCKET_WORKSPACE = bitbucketWorkspace || process.env.BITBUCKET_WORKSPACE;

    const openAIService = new OpenAIService(OPENAI_API_KEY);
    const githubService = new GitHubService(GITHUB_TOKEN, GITHUB_OWNER);
    const bitbucketService = new BitbucketService(BITBUCKET_TOKEN, BITBUCKET_WORKSPACE);
    const codeAnalyzer = new CodeAnalyzer(openAIService, REPO_PROVIDER, githubService, bitbucketService);

    console.log(`Fetching changes for PR #${pullRequestId}...`);
    const diff = await codeAnalyzer.getPullRequestDiff(repo, pullRequestId);

    if (diff) {
      console.log('Analyzing code changes...');
      await codeAnalyzer.addCodeSummary(diff, repo, pullRequestId);
      // await codeAnalyzer.analyzeCode(diff, repo, pullRequestId);
    } else {
      console.log("Failed to retrieve changes.");
    }
  });

program.parse(process.argv);
