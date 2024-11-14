import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import 'dotenv/config';

import GitHubService from './GithubService.js';
import OpenAIService from './OpenAIService.js';
import CodeAnalyzer from './CodeAnalyzer.js';
import { getVersion } from './utils.js';

const program = new Command();

program
  .requiredOption('--pull-request-id <number>', 'Pull request ID')
  .requiredOption('--repo <string>', 'Repository name (e.g., user/repo)')
  .option('--openai-api-key <string>', 'Open AI API key')
  .option('--github-owner <string>', 'Github owner')
  .option('--github-token <string>', 'Github token')
  .action(async (options) => {
    console.log(chalk.blue(figlet.textSync('pr code review', { horizontalLayout: 'full' })));
    console.log(chalk.yellow('VERSION: ', getVersion()));

    const { pullRequestId, repo, openaiApiKey, githubToken, githubOwner } = options;

    const GITHUB_TOKEN = githubToken || process.env.GITHUB_TOKEN;
    const OPENAI_API_KEY = openaiApiKey || process.env.OPENAI_API_KEY;
    const GITHUB_OWNER = githubOwner || process.env.GITHUB_OWNER;

    const openAIService = new OpenAIService(OPENAI_API_KEY);
    const githubService = new GitHubService(GITHUB_TOKEN, GITHUB_OWNER);
    const codeAnalyzer = new CodeAnalyzer(openAIService, githubService);

    console.log(`Fetching changes for PR #${pullRequestId}...`);
    const diff = await githubService.getPullRequestDiff(repo, pullRequestId);

    if (diff) {
      console.log('Analyzing code changes...');
      await codeAnalyzer.addCodeSummary(diff, repo, pullRequestId);
      await codeAnalyzer.analyzeCode(diff, repo, pullRequestId);
      await codeAnalyzer.addCodeComments(diff, repo, pullRequestId);
    } else {
      console.log("Failed to retrieve changes.");
    }
  });

program.parse(process.argv);
