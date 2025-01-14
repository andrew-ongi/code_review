export default class CodeAnalyzer {
    constructor(openAIService, repoProvider, githubService, bitbucketService) {
        this.openAIService = openAIService;
        console.log('githubService', githubService);
        console.log('bitbucketService', bitbucketService);
        this.repoService = (repoProvider.toLowerCase() == 'github' ? githubService : bitbucketService);
    }

    async getPullRequestDiff(repo, pullRequestId) {
      return this.repoService.getPullRequestDiff(repo, pullRequestId);
    }

    async analyzeCode(diff, repo, pullRequestId) {
      const prompt = `
  As an AI code reviewer, your role is to analyze the changes in a Merge Request (MR) within a software development project. 
  You will provide feedback: including potential bugs and critical issues, security and performance issues, and best practices. 
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
    - Overlooking the absence of a new line at the end of all files. This is typically represented in a git diff as '\\ No newline at end of file'.
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
  
  State in numbered points: function name, then followed by bullet points: the existing code snippet, feedback, and suggestion along with the recommended code snippet.
  Here are the code changes:
  ${diff}
      `;
      const model = 'gpt-4o-mini';
      const temperature = 0.3;
      const response = await this.openAIService.chatCompletion(model, temperature, prompt);
      await this.repoService.postPullRequestComment(repo, pullRequestId, response);
  }
  

    async addCodeSummary(diff, repo, pullRequestId) {
      const prompt = `
      Add a section called "## Changes Summary ✨" which contains a brief description of the overall changes in bullets. Ensure that each bullet point appears on a new line in Bitbucket by using Markdown syntax for line breaks (two spaces at the end of each line). The sentences should be very short but easy to understand.
      And add another section called "Changes Walkthrough" which contains a changes summary walkthrough in the form of a table with the following columns: **Section** and **Changes Summary**.
      - **Section** column should categorize changes into logical groups like "New DTOs and Validation," "Entity Relationship Updates," "Controller Enhancements," "Service Enhancements," or "Test Updates."
      - **Changes Summary** column contains 2 sections: file and changes
      - File section should list the file name and include a clickable reference to the diff hunk in the format: [\`<filename>\`](diffhunk://<reference>).  
      - Changes section summarizes the changes in 1-3 sentences for clarity.  
        - Use specific terms like "added," "updated," or "removed" to describe changes.  
        - Use bullet points when describing multiple modifications within the same file for readability.
        - Make the {changes_summary}] section collapsible only if it contains more than 2 items.
        - Changes should be a brief description of the changes in the file.
      - The table should be something like this:
      | **Section**                 | **Changes Summary**                                                                                              |
      |-----------------------------|------------------------------------------------------------------------------------------------------------------|
      | **{section}**               | [\`{file_name_ext}\`](diffhunk:{file_path})<br><details><summary>x changes</summary><ul><li>{change_1}</li><li>{change_2}</li><li>{change_3}</li></ul></details> |
      | **{section}**               | [\`{file_name_ext}\`](diffhunk:{file_path})<br><ul><li>{change}</li></ul>|
    
    Ensure all descriptions are concise and precise.
    Add emojis for critical changes only.
    Changes:
    ${diff}      
        `;
        const model = 'gpt-4o-mini';
        const temperature = 0.2;
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
        await this.repoService.appendPullRequestDescription(
            repo,
            pullRequestId,
            response,
            '---- Code Review Description ----',
            '---- End of Code Review Description ----',
        );
    }

    async addCodeComments(diff, repo, pullRequestId) {
        const prompt = `
      Add code comments to functions that do not already have them (e.g., Javadoc, JSDoc, etc., depending on the tech stack). Only add comments if they are missing for that code.

      ${diff}
    `;
        const model = 'gpt-4o-mini';
        const temperature = 0.2;
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
        await this.repoService.postPullRequestComment(repo, pullRequestId, response);
    }
}
