import axios from 'axios';

export default class GitHubService {
    constructor(token, owner) {
        this.token = token;
        this.owner = owner;
    }

    async getPullRequestDiff(repo, pullNumber) {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${repo}/pulls/${pullNumber}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    'X-GitHub-Api-Version': '2022-11-28',
                    Accept: "application/vnd.github.v3.diff",
                },
            });

            return response.data;
        } catch (error) {
            console.error("Error fetching PR diff:", error.message);
            return null;
        }
    }

    async postPullRequestComment(repo, pullNumber, comment) {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${repo}/issues/${pullNumber}/comments`;
            const response = await axios.post(
                url,
                {body: comment},
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );
            console.log("Comment posted successfully:", response.data.html_url);
        } catch (error) {
            console.error("Error posting comment:", error.message);
        }
    }

    async appendPullRequestDescription(repo, pullNumber, descriptionTpAppend, startAnchor, endAnchor) {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${repo}/pulls/${pullNumber}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });

            const existingDescription = response.data.body;
            const authorNotesHeader = '## **Author Notes**';
            let newDescription = '';
            if (!existingDescription) {
                newDescription = `${startAnchor}\n${descriptionTpAppend}\n${endAnchor}`;
            } else if (existingDescription.includes(startAnchor)) {
                // Append the new description after the start anchor and before the end anchor
                const startIndex = existingDescription.indexOf(startAnchor) + startAnchor.length;
                const endIndex = existingDescription.indexOf(endAnchor);

                let startExistingDescription = existingDescription.slice(0, startIndex);

                // Add authorNotesHeader if not present
                if (!startExistingDescription.includes(authorNotesHeader)) {
                    startExistingDescription = `${authorNotesHeader}\n\n${startExistingDescription}`;
                }

                newDescription = `${startExistingDescription}\n${descriptionTpAppend}\n${existingDescription.slice(endIndex)}`;
            } else {
                newDescription = `${authorNotesHeader}\n\n${existingDescription}\n\n${startAnchor}\n${descriptionTpAppend}\n${endAnchor}`;
            }

            await axios.patch(
                url,
                {body: newDescription},
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );
            console.log("Description appended successfully.");
        } catch (error) {
            console.error("Error appending description:", error.message);
        }
    }
}
