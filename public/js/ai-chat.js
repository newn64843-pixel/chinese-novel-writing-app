// AI Chat Module
class AIChatModule {
    constructor() {
        this.isLoading = false;
        this.conversationHistory = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        const aiInput = document.getElementById('aiInput');
        const aiSendBtn = document.getElementById('aiSendBtn');
        const clearChatBtn = document.getElementById('clearChatBtn');

        // Send message on button click
        aiSendBtn.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter (Shift+Enter for new line)
        aiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Clear chat history
        clearChatBtn.addEventListener('click', () => {
            this.clearChat();
        });

        // Auto-resize textarea
        aiInput.addEventListener('input', () => {
            this.autoResizeTextarea(aiInput);
        });
    }

    async sendMessage() {
        const aiInput = document.getElementById('aiInput');
        const message = aiInput.value.trim();

        if (!message || this.isLoading) return;

        this.isLoading = true;
        this.updateSendButton(true);

        // Add user message to chat
        this.addMessageToChat(message, 'user');
        aiInput.value = '';
        this.autoResizeTextarea(aiInput);

        try {
            // Get current project ID for context
            const projectId = window.app?.currentProject?.project?.id;
            
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message,
                    projectId,
                    sessionId: 'writing-session'
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.addMessageToChat(data.response, 'ai');
            } else {
                throw new Error(data.error || 'AI服务暂时不可用');
            }
        } catch (error) {
            console.error('AI Chat error:', error);
            this.addMessageToChat(
                '抱歉，AI助手暂时不可用。请检查网络连接或稍后再试。',
                'ai'
            );
        } finally {
            this.isLoading = false;
            this.updateSendButton(false);
            aiInput.focus();
        }
    }

    addMessageToChat(message, sender) {
        const chatContainer = document.getElementById('aiChat');
        const messageElement = document.createElement('div');
        messageElement.className = `ai-message ${sender}`;

        const contentElement = document.createElement('div');
        contentElement.className = 'message-content';
        contentElement.textContent = message;

        messageElement.appendChild(contentElement);
        chatContainer.appendChild(messageElement);

        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Store in history
        this.conversationHistory.push({
            message,
            sender,
            timestamp: new Date().toISOString()
        });
    }

    updateSendButton(loading) {
        const sendBtn = document.getElementById('aiSendBtn');
        if (loading) {
            sendBtn.textContent = '发送中...';
            sendBtn.disabled = true;
        } else {
            sendBtn.textContent = '发送';
            sendBtn.disabled = false;
        }
    }

    clearChat() {
        const chatContainer = document.getElementById('aiChat');
        
        // Remove all messages except welcome message
        const messages = chatContainer.querySelectorAll('.ai-message:not(.welcome)');
        messages.forEach(message => message.remove());
        
        this.conversationHistory = [];
        
        // Clear server-side history
        fetch('/api/ai/history/writing-session', {
            method: 'DELETE'
        }).catch(console.error);
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    // Writing suggestions feature
    async getWritingSuggestions(type = 'continue') {
        const editor = document.getElementById('chapterEditor');
        const content = editor.value;

        if (!content.trim()) {
            this.addMessageToChat('请先在编辑器中输入一些内容，我才能提供建议。', 'ai');
            return;
        }

        this.isLoading = true;
        this.updateSendButton(true);

        try {
            const projectId = window.app?.currentProject?.project?.id;
            const chapterId = window.app?.currentChapter?.id;

            const response = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content,
                    type,
                    projectId,
                    chapterId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                const typeLabels = {
                    continue: '续写建议',
                    improve: '文字润色',
                    conflict: '冲突建议'
                };
                
                this.addMessageToChat(`【${typeLabels[type]}】\n\n${data.suggestions}`, 'ai');
            } else {
                throw new Error(data.error || '获取建议失败');
            }
        } catch (error) {
            console.error('Writing suggestions error:', error);
            this.addMessageToChat('抱歉，无法获取写作建议。请稍后再试。', 'ai');
        } finally {
            this.isLoading = false;
            this.updateSendButton(false);
        }
    }

    // Character dialogue generation
    async generateCharacterDialogue(characterId, situation) {
        if (!characterId || !situation) {
            this.addMessageToChat('请选择角色并描述情况来生成对话。', 'ai');
            return;
        }

        this.isLoading = true;
        this.updateSendButton(true);

        try {
            const projectId = window.app?.currentProject?.project?.id;

            const response = await fetch('/api/ai/dialogue', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    characterId,
                    situation,
                    projectId
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.addMessageToChat(`【${data.character}的对话】\n\n${data.dialogue}`, 'ai');
            } else {
                throw new Error(data.error || '生成对话失败');
            }
        } catch (error) {
            console.error('Character dialogue error:', error);
            this.addMessageToChat('抱歉，无法生成角色对话。请稍后再试。', 'ai');
        } finally {
            this.isLoading = false;
            this.updateSendButton(false);
        }
    }

    // Quick action buttons
    createQuickActions() {
        const quickActions = document.createElement('div');
        quickActions.className = 'ai-quick-actions';
        quickActions.innerHTML = `
            <div class="quick-actions-header">快捷操作</div>
            <div class="quick-actions-buttons">
                <button class="quick-action-btn" data-action="continue">续写建议</button>
                <button class="quick-action-btn" data-action="improve">文字润色</button>
                <button class="quick-action-btn" data-action="conflict">冲突建议</button>
            </div>
        `;

        // Add event listeners
        quickActions.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-action-btn')) {
                const action = e.target.dataset.action;
                this.getWritingSuggestions(action);
            }
        });

        return quickActions;
    }

    // Add quick actions to the AI panel
    addQuickActions() {
        const aiPanel = document.querySelector('.ai-panel');
        const inputContainer = document.querySelector('.ai-input-container');
        
        if (aiPanel && inputContainer && !document.querySelector('.ai-quick-actions')) {
            const quickActions = this.createQuickActions();
            aiPanel.insertBefore(quickActions, inputContainer);
        }
    }
}

// Add CSS for quick actions
const quickActionsCSS = `
.ai-quick-actions {
    padding: 10px 15px;
    border-top: 1px solid #e0e0e0;
    background: #f8f9fa;
}

.quick-actions-header {
    font-size: 12px;
    color: #6c757d;
    margin-bottom: 8px;
    font-weight: 500;
}

.quick-actions-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.quick-action-btn {
    padding: 4px 8px;
    border: 1px solid #dee2e6;
    background: white;
    color: #495057;
    border-radius: 12px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
}

.quick-action-btn:hover {
    background: #e9ecef;
    border-color: #adb5bd;
}
`;

// Add CSS to document
const style = document.createElement('style');
style.textContent = quickActionsCSS;
document.head.appendChild(style);

// Initialize AI Chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aiChatModule = new AIChatModule();
    
    // Add quick actions after a short delay to ensure DOM is ready
    setTimeout(() => {
        window.aiChatModule.addQuickActions();
    }, 100);
});