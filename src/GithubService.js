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

    async appendPullRequestDescription(repo, pullNumber, descriptionTpAppend) {
        try {
            const url = `https://api.github.com/repos/${this.owner}/${repo}/pulls/${pullNumber}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                    Accept: "application/vnd.github.v3+json",
                },
            });

            const existingDescription = response.data.body;
            let newDescription = '';
            if (!existingDescription) {
                newDescription = `${descriptionTpAppend}`;
            } else if (!existingDescription.includes(descriptionTpAppend)) {
                newDescription = `### **Author Notes**\n\n${existingDescription}\n\n---\n${descriptionTpAppend}`;
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
