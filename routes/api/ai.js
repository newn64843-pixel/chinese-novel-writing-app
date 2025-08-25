const express = require('express');
const { geminiAI } = require('../../config/gemini');
const Project = require('../../models/Project');
const router = express.Router();

// Initialize Gemini AI on startup
geminiAI.initialize();

// Chat with AI assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, projectId, sessionId = 'default' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get project context if projectId is provided
    let projectContext = {};
    if (projectId) {
      projectContext = await Project.getProjectContext(projectId);
    }

    const response = await geminiAI.generateResponse(message, projectContext, sessionId);
    
    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// Get conversation history
router.get('/history/:sessionId?', (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    const history = geminiAI.getConversationHistory(sessionId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// Clear conversation history
router.delete('/history/:sessionId?', (req, res) => {
  try {
    const sessionId = req.params.sessionId || 'default';
    geminiAI.clearConversationHistory(sessionId);
    res.json({ message: 'Conversation history cleared' });
  } catch (error) {
    console.error('Error clearing conversation history:', error);
    res.status(500).json({ error: 'Failed to clear conversation history' });
  }
});

// Get AI writing suggestions based on current content
router.post('/suggest', async (req, res) => {
  try {
    const { content, type = 'continue', projectId, chapterId } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required for suggestions' });
    }

    // Get project context
    let projectContext = {};
    if (projectId) {
      projectContext = await Project.getProjectContext(projectId);
      
      // Add current chapter context if provided
      if (chapterId && projectContext.chapters) {
        const currentChapter = projectContext.chapters.find(ch => ch.id == chapterId);
        if (currentChapter) {
          projectContext.currentChapter = currentChapter;
        }
      }
    }

    let suggestionPrompt = '';
    switch (type) {
      case 'continue':
        suggestionPrompt = `请根据以下内容，提供2-3个可能的后续发展方向：\n\n${content.slice(-500)}`;
        break;
      case 'improve':
        suggestionPrompt = `请对以下文字提供润色建议，使其更符合中国古典文学风格：\n\n${content.slice(-300)}`;
        break;
      case 'conflict':
        suggestionPrompt = `基于当前情节，建议一些可能的冲突或转折点：\n\n${content.slice(-500)}`;
        break;
      default:
        suggestionPrompt = `对这段内容有什么建议？\n\n${content.slice(-300)}`;
    }

    const response = await geminiAI.generateResponse(suggestionPrompt, projectContext, `suggestion_${Date.now()}`);
    
    res.json({
      suggestions: response,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Generate character dialogue based on personality
router.post('/dialogue', async (req, res) => {
  try {
    const { characterId, situation, projectId } = req.body;
    
    if (!characterId || !situation) {
      return res.status(400).json({ error: 'Character ID and situation are required' });
    }

    // Get project context including characters
    const projectContext = await Project.getProjectContext(projectId);
    if (!projectContext || !projectContext.characters) {
      return res.status(404).json({ error: 'Project or characters not found' });
    }

    const character = projectContext.characters.find(ch => ch.id == characterId);
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    const dialoguePrompt = `请根据角色${character.name}的性格特点，为以下情况生成合适的对话：
    
角色信息：
- 姓名：${character.name}
- 性格：${character.personality || '未设定'}
- 背景：${character.background || '未设定'}
- 外貌：${character.appearance || '未设定'}

情况：${situation}

请生成符合这个角色性格的对话，包括语言风格、用词习惯等。`;

    const response = await geminiAI.generateResponse(dialoguePrompt, projectContext, `dialogue_${Date.now()}`);
    
    res.json({
      dialogue: response,
      character: character.name,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating dialogue:', error);
    res.status(500).json({ error: 'Failed to generate dialogue' });
  }
});

module.exports = router;