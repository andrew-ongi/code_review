import axios from 'axios';

export default class BitbucketService {
    constructor(token, workspace) {
        this.token = token;
        this.workspace = workspace;
    }

    async getPullRequestDiff(repoSlug, pullNumber) {
        try {
            const url = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${repoSlug}/pullrequests/${pullNumber}/diff`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            return response.data;
        } catch (error) {
            console.error("Error fetching PR diff:", error.message);
            return null;
        }
    }

    async postPullRequestComment(repoSlug, pullNumber, comment) {
        try {
            const url = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${repoSlug}/pullrequests/${pullNumber}/comments`;
            const response = await axios.post(
                url,
                {content: {raw: comment}},
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            );
            console.log("Comment posted successfully:", response.data);
        } catch (error) {
            console.error("Error posting comment:", error.message);
        }
    }

    async appendPullRequestDescription(repoSlug, pullNumber, descriptionToAppend, startAnchor, endAnchor) {
        try {
            const url = `https://api.bitbucket.org/2.0/repositories/${this.workspace}/${repoSlug}/pullrequests/${pullNumber}`;
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${this.token}`,
                },
            });

            const existingDescription = response.data.description;
            const authorNotesHeader = '## **Author Notes**';
            let newDescription = '';
            if (!existingDescription) {
                newDescription = `${startAnchor} \n \n ${descriptionToAppend} \n \n ${endAnchor}`;
            } else if (existingDescription.includes(startAnchor)) {
                const startIndex = existingDescription.indexOf(startAnchor) + startAnchor.length;
                const endIndex = existingDescription.indexOf(endAnchor);

                let startExistingDescription = existingDescription.slice(0, startIndex);

                if (!startExistingDescription.includes(authorNotesHeader)) {
                    startExistingDescription = `${authorNotesHeader}\n\n${startExistingDescription}`;
                }

                newDescription = `${startExistingDescription}\n${descriptionToAppend}\n${existingDescription.slice(endIndex)}`;
            } else {
                newDescription = `${authorNotesHeader} \n\n ${existingDescription}\n\n${startAnchor} \n \n ${descriptionToAppend} \n \n ${endAnchor}`;
            }

            await axios.put(
                url,
                {description: newDescription},
                {
                    headers: {
                        Authorization: `Bearer ${this.token}`,
                    },
                }
            );
            console.log("Description appended successfully.");
        } catch (error) {
            console.error("Error appending description:", error.message);
        }
    }
}
