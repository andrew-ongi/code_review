import OpenAI from 'openai';

export default class OpenAIService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async chatCompletion(model, temperature, prompt) {
    try {
      const options = {
        model,
        messages: [
          { role: "system", content: `You are a highly experienced Technical Lead with the capability to design system architecture. You are a full-stack expert, proficient in backend, web frontend, and mobile development. Your responsibilities include conducting code reviews with a focus on best practices, code standards, security, potential bugs and issues, performance, and compatibility with existing code, while considering the overall context of the code.
Your backend tech stack includes Golang, Node.js, Java, and PHP. For web frontend, you specialize in Angular, React, and Vue, while for mobile development, you work with both native platforms and Flutter.
You will always respond in English.`},
          { role: "user", content: prompt },
        ],
        temperature,
      };

      const response = await this.openai.chat.completions.create(options);
      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error during chat completion:", error.message);
      return null;
    }
  }
}
