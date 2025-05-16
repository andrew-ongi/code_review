export default class CodeAnalyzer {
    constructor(openAIService, repoProvider, githubService, bitbucketService) {
        this.openAIService = openAIService;
        this.repoService = (repoProvider.toLowerCase() == 'github' ? githubService : bitbucketService);
    }

    async getPullRequestDiff(repo, pullRequestId) {
      return this.repoService.getPullRequestDiff(repo, pullRequestId);
    }

    async analyzeCode(diff, repo, pullRequestId) {
      const prompt = `
        You are an automated AI code reviewer. Analyze the following git diff from a Merge Request (MR).
    Focus only on changed lines (added, modified, or deleted) — ignore unchanged lines.
    Provide structured feedback on potential bugs, security risks, and adherence to best practices.
    Only use the context available in the diff. Do not assume code outside of it.
    
    Your responsibilities include:          
      - Analyzing only the lines of code that have been added, edited, or deleted in the MR. 
      - Ignoring unchanged lines of code.
      - Providing feedback in Markdown format, including code snippets and suggestions for improvement.
      - For suggestions that include code changes, always include both the original (old) and the suggested code in separate code blocks.
      - Assign a score (0–10) in each category (higher = better quality):
        - **Bugs**: Are there any bugs introduced in the code? Provide details and assign a severity score (0: Critical bug, 10: No bugs).
        - **Security**: Does the code introduce any security vulnerabilities? Provide details and assign a severity score (0: High-risk vulnerability, 10: No issues).
        - **Best Practices**: Does the code follow programming best practices? Provide feedback and assign a quality score (0: Severe deviation, 10: Follows best practices).
      - Writing 'EMPTY_CODE_REVIEW' if there are no bugs, security issues, or best practice deviations identified.
    
    Provide the feedback and scores in this format:
    
    ### Code Review Summary
    1. **Function Name / Section**
        - **Bugs**: {bug description} (Score: X/10)
        - **Security**: {security issue description} (Score: X/10)
        - **Best Practices**: {feedback} (Score: X/10)
        - **Suggestion**: {short brief of the suggestion} {for code suggestion, write old code and suggestion in code snippet, separated by new line } (Please separate description and code suggestion with new line). for example:        
          Old Code: 

          \`\`\`javascript
          constructor(openAIService, repoProvider, githubService, bitbucketService) {
          \`\`\`

          Suggested Code:

          \`\`\`javascript
          constructor(openAIService, repositoryProvider, githubService, bitbucketService) { 
          \`\`\`
    
    Overall Score: {Average score across all categories, in bold}
    
    Here are the code changes:
    ${diff}
        `;
        const model = 'gpt-4o-mini';
        const temperature = 0.3;
    
        // Call GPT to get the review and scores
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
        await this.repoService.postPullRequestComment(repo, pullRequestId, response);
    }

    async addCodeSummary(diff, repo, pullRequestId) {
      const prompt = `
    Add a section called "## Changes Summary ✨" which contains a brief description of the overall changes in bullet points.  
    Ensure each bullet point appears on a new line and avoid using unsupported formats. Use (\n) as new line separator.
    
    Then, add another section called "## Changes Walkthrough" as a simple Markdown table. The table should have the following columns:  
    
    | **Section**                 | **Changes Summary**                       |
    |-----------------------------|-------------------------------------------|
    | Logical group of changes    | File name and concise change details      |
    
    ### Formatting Rules:
    1. **Changes Summary ✨**: Use \`-\` (dash) for bullet points and ensure line breaks are clear.  
    2. **Changes Walkthrough**: 
      - Group changes into categories such as "Controller Enhancements" or "Entity Relationship Updates."
      - In the **Changes Summary** column:
        - Start with the file name in bold (e.g., **userController.js**).  
        - Follow it with a description of changes as bullet points (e.g., \`-\` for each change).  
    
    ### Example:
    
    ## Changes Summary ✨
    - Added a login endpoint in the user controller.  
    - Updated schema for user roles with default values.  
    
    ## Changes Walkthrough  
    
    | **Section**                 | **Changes Summary**                       |
    |-----------------------------|-------------------------------------------|
    | **Controller Enhancements** | **File:** **userController.js**           |
    |                             |   - Added endpoint for user login.        |
    |                             |   - Improved error handling for tokens.   |
    | **Entity Updates**          | **File:** **userModel.js**                |
    |                             |   - Updated schema for roles.             |
    |                             |   - Added default value for 'isActive'.   |
    
    Ensure the descriptions are concise, precise, and fully compatible with Markdown as supported by Bitbucket. Avoid using unsupported references or HTML tags.  
    
    Here are the code changes:  
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
