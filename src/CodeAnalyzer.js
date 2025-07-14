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
        You are an automated AI code reviewer. Analyze the following git diff. Only review code changes (ignore unchanged lines and documentation). Strictly do not assume or hallucinate any context outside the diff.

        For each function or section changed:
        - Identify possible bugs, security risks, and best practice issues (only on changed lines).
        - For suggestions, provide both the original code ("Old Code") and the suggested code ("Suggested Code") in code blocks.
        - Give a score 0-10 per category: Bugs, Security, Best Practices (higher = better).
        - If there are no issues in any category, respond only with: 'EMPTY_CODE_REVIEW'.

        Use this output format per function/section:
        ### Code Review Summary
        1. **Function Name / Section**
            
            - **Bugs**: {description} (Score: X/10) \n
            
            - **Security**: {description} (Score: X/10) \n
            
            - **Best Practices**: {description} (Score: X/10) \n
            
            - **Suggestion**:
              \nOld Code:
              \`\`\`javascript (or relevant techstack)
              // ...
              \`\`\`
              \nSuggested Code:
              \`\`\`javascript (or relevant techstack)
              // ...
              \`\`\`

        At the end, output:
        Overall Score: {AVERAGE (min score across all section/category if any score is 0)}

        Here are the code changes:
        ${diff}

        `;
        const model = 'gpt-4.1-mini';
        const temperature = 0.3;
    
        // Call GPT to get the review and scores
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
        await this.repoService.postPullRequestComment(repo, pullRequestId, response);
    }

    async addCodeSummary(diff, repo, pullRequestId) {
      const prompt = `
    Summarize the following git diff into two sections in Markdown for a pull request description.

    **Section 1: "## Changes Summary ✨"**
    - Write a concise, factual summary of the code changes using '-' (dash) as bullet points.
    - Each bullet must be on its own line, with no extra spaces or line breaks.
    - Skip this section if no code changes are present.

    **Section 2: "## Changes Walkthrough"**
    - Present a Markdown table with these columns: Section | File | Changes Summary
    - Section: Group the changes logically, e.g., "Controller Updates", "Service Logic", "Entity Changes". If unsure, use the file's main role as section.
    - File: The filename where changes happened (no bold, no HTML).
    - Changes Summary: Each bullet (-) is a short, precise line describing a distinct change in that file.
    - One row per file. If multiple categories in one file, split rows as needed.

    **Formatting Rules:**
    - Do not use HTML, references, or advanced markdown unsupported in Bitbucket.
    - Use plain newlines and dashes for bullets, no explicit "\n" in output.
    - Ignore and do not mention unchanged files or documentation-only changes.
    - If there are no code changes, respond only with: "NO_CODE_CHANGE".

    **Example:**

    ## Changes Summary ✨
    
      - Added login endpoint to userController.js \n
    
      - Updated role schema in userModel.js \n

    ## Changes Walkthrough


    | Section             | File             | Changes Summary                     |
    |---------------------|------------------|-------------------------------------|
    | Controller Updates  | userController.js| - Added login endpoint              |
    |                     |                  | - Improved token error handling     |
    | Entity Updates      | userModel.js     | - Updated role schema               |
    |                     |                  | - Set default for isActive          |
    
    \n\n


    Here are the code changes:
    ${diff}

        `;
        const model = 'gpt-4.1-nano';
        const temperature = 0.2;
    
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
        
        await this.repoService.appendPullRequestDescription(
            repo,
            pullRequestId,
            response,
            `
            
            ---- Code Review Description ----
            
            `,
            `
            
            ---- End of Code Review Description ----
            
            `,
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
