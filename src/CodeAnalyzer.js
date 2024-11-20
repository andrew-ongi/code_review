export default class CodeAnalyzer {
  constructor(openAIService, githubService) {
    this.openAIService = openAIService;
    this.githubService = githubService;
  }

  async analyzeCode(diff, repo, pullRequestId) {
    const prompt = `
      As an AI code reviewer, your role is to analyze the changes in a Merge Request (MR) within a software development project. 
      You will provide feedback: including potential bugs and critical issues, security and performance, and best practice. 
      You need to consider the overall context of the file changes before conducting a review.
      The changes in the MR are provided in the standard git diff (unified diff) format. 

      Your responsibilities include:          
        - Analyzing only the lines of code that have been added, edited, or deleted in the MR. For example, in a git diff, these would be the lines starting with a '+' or '-'.
        \`\`\`diff
        - old line of code
        + new line of code
        \`\`\`
        - Ignoring any code that hasn't been modified. In a git diff, these would be the lines starting with a ' ' (space).
        \`\`\`diff
            unchanged line of code
        \`\`\`
        - Avoiding repetition in your reviews if the line of code is correct. For example, if the same line of code appears multiple times in the diff, you should only comment on it once.
        - Overlooking the absence of a new line at the end of all files. This is typically represented in a git diff as '\ No newline at end of file'.
        - Using bullet points for clarity if you have multiple comments.
        \`\`\`markdown
        - Comment 1
        - Comment 2
        \`\`\`
        - Leveraging Markdown to format your feedback effectively. For example, you can use backticks to format code snippets.
        \`\`\`markdown
        \`code snippet\`
        \`\`\`
        - Writing 'EMPTY_CODE_REVIEW' if there are no bugs or critical issues identified.
        - Refraining from writing 'EMPTY_CODE_REVIEW' if there are bugs or critical issues.

        State in number point: function name, then followed by bullet points: existing code snippet, feedback, and suggestion along with the recommended code snippet.
      Here are the code changes:
      ${diff}
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.3;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }

  async addCodeSummary(diff, repo, pullRequestId) {
    const prompt = `
      Please create a summary of changes in the form of a table with the columns: File Changes | Summary. 
      File Changes should only include the file name (no full path). 
      For each file changes, provide a summary (up to 3-5 sentences) followed by a detailed bullet point list of the changes.
      Use bullet points for clarity if you have multiple comments in the Summary column (in collapsible format in next row):
        \`\`\`markdown
        - Comment 1
        - Comment 2
        \`\`\`
        - Leveraging Markdown to format your feedback effectively. For example, you can use backticks to format code snippets.
        \`\`\`markdown
        \`code snippet\`
        \`\`\`
      ${diff}      
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.2;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }

  async addCodeComments(diff, repo, pullRequestId) {
    const prompt = `
      Add code comments to functions that do not already have them (e.g., Javadoc, JSDoc, etc., depending on the tech stack). Only add comments if they are missing for that code.

      ${diff}
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.2;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }
}
  