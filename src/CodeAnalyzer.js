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
    As an AI code reviewer, your role is to analyze the changes in a Merge Request (MR) within a software development project. 
    You will provide feedback: including potential bugs and critical issues, security and performance issues, and best practices. 
    You need to consider the overall context of the file changes before conducting a review.
    The changes in the MR are provided in the standard git diff (unified diff) format. 
    
    Your responsibilities include:          
      - Analyzing only the lines of code that have been added, edited, or deleted in the MR. 
      - Ignoring unchanged lines of code.
      - Providing feedback in Markdown format, including code snippets and suggestions for improvement.
      - Assigning a score (0-10) based on each category:
        - **Bugs**: Are there any bugs introduced in the code? Provide details and assign a severity score (0: No bugs, 10: Critical bug).
        - **Security**: Does the code introduce any security vulnerabilities? Provide details and assign a severity score (0: No issues, 10: High-risk vulnerability).
        - **Best Practices**: Does the code follow programming best practices? Provide feedback and assign a quality score (0: Follows best practices, 10: Severe deviation).
      - Writing 'EMPTY_CODE_REVIEW' if there are no bugs, security issues, or best practice deviations identified.
    
    Provide the feedback and scores in this format:
    \`\`\`markdown
    ### Code Review Summary
    1. **Function Name / Section**
        - **Bugs**: {bug description} (Score: X/10)
        - **Security**: {security issue description} (Score: X/10)
        - **Best Practices**: {feedback} (Score: X/10)
        - **Suggestion**: {suggestion with recommended code snippet}
    
    Overall Score: {Average score across all categories}
    \`\`\`
    
    Here are the code changes:
    ${diff}
        `;
        const model = 'gpt-4o-mini';
        const temperature = 0.3;
    
        // Call GPT to get the review and scores
        const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    
        // Parse response and calculate the overall score
        const parsedResponse = this.parseReviewResponse(response); // Function to parse GPT response
        const overallScore = this.calculateOverallScore(parsedResponse.scores);
    
        // Append review to pull request
        const reviewSummary = `
    ---- Code Review ----
    ${parsedResponse.feedback}
    **Overall Score**: ${overallScore.toFixed(1)}/10
    ---- End of Code Review ----
        `;
        await this.repoService.postPullRequestComment(repo, pullRequestId, reviewSummary);
    }
    
    // Helper function to parse GPT response and extract scores
    parseReviewResponse(response) {
        const feedback = response; // Assuming response already contains Markdown-formatted feedback
        const scores = [];
    
        // Extract scores (you can customize this part to parse structured data from the response)
        const regex = /\*\*(Bugs|Security|Best Practices)\*\*:.*?Score: (\d+)\/10/g;
        let match;
        while ((match = regex.exec(response)) !== null) {
            scores.push(parseInt(match[2], 10));
        }
    
        return { feedback, scores };
    }
    
    // Helper function to calculate overall score
    calculateOverallScore(scores) {
        if (scores.length === 0) return 10; // Default to 10 if no issues found
        const total = scores.reduce((sum, score) => sum + score, 0);
        return total / scores.length;
    }
  
  

    async addCodeSummary(diff, repo, pullRequestId) {
      const prompt = `
      Provide a concise summary of the changes in this Merge Request (MR) for easy understanding and documentation. Include the following:

      ### **Summary Requirements:**
      1. **Changes Summary ✨**:
        - Briefly list overall changes in bullet points.
        - Use short, easy-to-understand sentences.

      2. **Changes Walkthrough**:
        - Present a table with these columns:
          | **Section**                 | **Changes Summary**                                                                                              |
          |-----------------------------|------------------------------------------------------------------------------------------------------------------|
          | **Logical Group (e.g., New DTOs, Validation, etc.)** | [\`<filename>\`](diffhunk://<reference>)<br><ul><li>{change_1}</li><li>{change_2}</li></ul> |

        - For **Section**, categorize changes (e.g., New DTOs and Validation, Controller Enhancements, etc.).
        - For **Changes Summary**, include:
          - File name (clickable reference to diff hunk: \`[\`<filename>\`](diffhunk://<reference>)\`).
          - Brief change descriptions (use terms like "added", "updated", etc.).

      3. Highlight critical changes with emojis for better visibility.
      4. Ensure descriptions are concise and clear.

      ### Example Table:
      | **Section**                 | **Changes Summary**                                                                                              |
      |-----------------------------|------------------------------------------------------------------------------------------------------------------|
      | **New DTOs and Validation** | [\`user.dto.js\`](diffhunk://src/dtos/user.dto.js)<br><ul><li>Added validation for email</li></ul>               |

      ### Diff:
      ${diff}}      
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
