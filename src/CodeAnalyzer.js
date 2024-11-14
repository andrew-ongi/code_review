export default class CodeAnalyzer {
  constructor(openAIService, githubService) {
    this.openAIService = openAIService;
    this.githubService = githubService;
  }

  async analyzeCode(diff, repo, pullRequestId) {
    const prompt = `
      Berikut adalah perubahan kode dari Pull Request:

      ${diff}
      
      Lakukan *code review* dan berikan feedback, termasuk saran perbaikan performa, keamanan, dan *best practices*, dengan menyebutkan lokasi file, nama function, potongan code yang dimaksud, dan saran/contoh perubahan code (berikan juga highlight apa yang perlu diubah jika ada), dalam bahasa inggris.
      Sebutkan dalam point-point: functionnya, code existing, feedback, dan suggestion dan potongan code yang disarankan
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.3;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }

  async addCodeSummary(diff, repo, pullRequestId) {
    const prompt = `
      Berikut adalah perubahan kode dari Pull Request:

      ${diff}

      Tolong buat ringkasan perubahan dalam bentuk tabel dengan kolom: File changes | Summary. Summary dalam bentuk point-point, dan file changes cukup nama file saja, tidak perlu fullpath, dan dalam bahasa inggris
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.2;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }

  async addCodeComments(diff, repo, pullRequestId) {
    const prompt = `
      Berikut adalah perubahan kode dari Pull Request:

      ${diff}

      1. Tambahkan code comment ke function yang belum memiliki code comment (javadoc, jsdoc, etc tergantung techstack)
    `;
    const model = 'gpt-4o-mini';
    const temperature = 0.2;
    const response = await this.openAIService.chatCompletion(model, temperature, prompt);
    await this.githubService.postPullRequestComment(repo, pullRequestId, response);
  }
}
  