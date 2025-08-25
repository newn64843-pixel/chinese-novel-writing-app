const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.model = null;
    this.conversationHistory = new Map(); // Store conversations by session
  }

  initialize() {
    if (!this.apiKey) {
      console.warn('GEMINI_API_KEY not found in environment variables. AI features will be limited.');
      return false;
    }

    try {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('Gemini AI initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      return false;
    }
  }

  // Build context-aware prompt for Chinese literature
  buildPrompt(userMessage, projectContext = {}) {
    const systemPrompt = `你是一位精通中国古典文学、武侠小说和玄幻小说的资深作家助手。你具备以下专业知识：

专业领域：
- 中国历史各朝代的政治、文化、社会制度
- 古典文学作品（四大名著、诗词歌赋等）
- 武侠小说的武功体系、江湖门派、侠义精神
- 玄幻修仙体系（筑基、结丹、元婴等境界）
- 中国神话传说、民间故事、道教佛教文化
- 古代生活方式（服饰、建筑、饮食、礼仪）
- 传统兵器、战术、阵法

助手特点：
- 只在被询问时提供建议，不主动推荐
- 给出概括性建议，让作者可以进一步询问细节
- 理解并记忆重要的故事背景和角色设定
- 保持中文回答，语言风格典雅而易懂

当前项目背景：
${this.formatProjectContext(projectContext)}

请根据用户的问题，提供专业而有用的建议。`;

    return systemPrompt + '\n\n用户问题：' + userMessage;
  }

  formatProjectContext(context) {
    let formatted = '';
    
    if (context.project) {
      formatted += `项目：${context.project.name}\n`;
      if (context.project.description) {
        formatted += `简介：${context.project.description}\n`;
      }
      if (context.project.genre) {
        formatted += `类型：${context.project.genre}\n`;
      }
    }

    if (context.characters && context.characters.length > 0) {
      formatted += '\n主要角色：\n';
      context.characters.forEach(char => {
        formatted += `- ${char.name}：${char.description || '暂无描述'}\n`;
      });
    }

    if (context.currentChapter) {
      formatted += `\n当前章节：${context.currentChapter.title}\n`;
      if (context.currentChapter.summary) {
        formatted += `章节概要：${context.currentChapter.summary}\n`;
      }
    }

    if (context.worldBuilding && context.worldBuilding.length > 0) {
      formatted += '\n世界设定：\n';
      context.worldBuilding.forEach(world => {
        formatted += `- ${world.name} (${world.type})：${world.description || '暂无描述'}\n`;
      });
    }

    return formatted || '暂无项目背景信息';
  }

  async generateResponse(userMessage, projectContext = {}, sessionId = 'default') {
    if (!this.model) {
      return '抱歉，AI助手暂时不可用。请检查API配置。';
    }

    try {
      const prompt = this.buildPrompt(userMessage, projectContext);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      // Store conversation in history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, []);
      }
      
      const history = this.conversationHistory.get(sessionId);
      history.push({
        user: userMessage,
        ai: response.text(),
        timestamp: new Date().toISOString()
      });

      // Keep only last 10 conversations to manage memory
      if (history.length > 10) {
        history.splice(0, history.length - 10);
      }

      return response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      return '抱歉，处理您的请求时出现了错误。请稍后再试。';
    }
  }

  getConversationHistory(sessionId = 'default') {
    return this.conversationHistory.get(sessionId) || [];
  }

  clearConversationHistory(sessionId = 'default') {
    this.conversationHistory.delete(sessionId);
  }
}

// Singleton instance
const geminiAI = new GeminiAI();

module.exports = { geminiAI };