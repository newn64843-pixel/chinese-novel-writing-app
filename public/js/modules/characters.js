// Characters Module
class CharactersModule {
    constructor() {
        this.characters = [];
        this.currentProjectId = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Add character button
        document.getElementById('addCharacterBtn').addEventListener('click', () => {
            this.showCharacterModal();
        });

        // Character form submission
        document.getElementById('characterForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCharacter();
        });
    }

    async loadCharacters(projectId) {
        this.currentProjectId = projectId;
        
        try {
            const response = await fetch(`/api/characters/project/${projectId}`);
            this.characters = await response.json();
            this.renderCharacters();
        } catch (error) {
            console.error('Failed to load characters:', error);
            window.app.showNotification('加载角色失败', 'error');
        }
    }

    renderCharacters() {
        const container = document.getElementById('charactersGrid');
        container.innerHTML = '';

        if (this.characters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-muted">还没有创建角色</p>
                    <button class="btn btn-primary" onclick="window.charactersModule.showCharacterModal()">
                        创建第一个角色
                    </button>
                </div>
            `;
            return;
        }

        this.characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            container.appendChild(characterCard);
        });
    }

    createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <h4>${this.escapeHtml(character.name)}</h4>
            <p><strong>简介:</strong> ${this.escapeHtml(character.description) || '暂无描述'}</p>
            <p><strong>性格:</strong> ${this.escapeHtml(character.personality) || '暂无描述'}</p>
            <p><strong>背景:</strong> ${this.truncateText(character.background, 100) || '暂无描述'}</p>
            ${character.appearance ? `<p><strong>外貌:</strong> ${this.truncateText(character.appearance, 80)}</p>` : ''}
            <div class="character-actions">
                <button class="btn btn-sm" onclick="window.charactersModule.editCharacter(${character.id})">
                    编辑
                </button>
                <button class="btn btn-sm" onclick="window.charactersModule.generateDialogue(${character.id})">
                    生成对话
                </button>
                <button class="btn btn-sm" onclick="window.charactersModule.deleteCharacter(${character.id})" 
                        style="color: #dc3545;">
                    删除
                </button>
            </div>
        `;
        return card;
    }

    showCharacterModal(character = null) {
        const modal = document.getElementById('characterModal');
        const title = document.getElementById('characterModalTitle');
        const form = document.getElementById('characterForm');

        if (character) {
            title.textContent = '编辑角色';
            this.fillCharacterForm(character);
        } else {
            title.textContent = '新增角色';
            form.reset();
            document.getElementById('characterId').value = '';
        }

        modal.classList.add('active');
        document.getElementById('characterName').focus();
    }

    fillCharacterForm(character) {
        document.getElementById('characterId').value = character.id;
        document.getElementById('characterName').value = character.name || '';
        document.getElementById('characterDescription').value = character.description || '';
        document.getElementById('characterPersonality').value = character.personality || '';
        document.getElementById('characterBackground').value = character.background || '';
        document.getElementById('characterRelationships').value = character.relationships || '';
        document.getElementById('characterAppearance').value = character.appearance || '';
    }

    async saveCharacter() {
        if (!this.currentProjectId) {
            window.app.showNotification('请先选择项目', 'warning');
            return;
        }

        const characterId = document.getElementById('characterId').value;
        const characterData = {
            project_id: this.currentProjectId,
            name: document.getElementById('characterName').value.trim(),
            description: document.getElementById('characterDescription').value.trim(),
            personality: document.getElementById('characterPersonality').value.trim(),
            background: document.getElementById('characterBackground').value.trim(),
            relationships: document.getElementById('characterRelationships').value.trim(),
            appearance: document.getElementById('characterAppearance').value.trim()
        };

        if (!characterData.name) {
            window.app.showNotification('请输入角色名称', 'warning');
            return;
        }

        try {
            let response;
            if (characterId) {
                // Update existing character
                response = await fetch(`/api/characters/${characterId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(characterData)
                });
            } else {
                // Create new character
                response = await fetch('/api/characters', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(characterData)
                });
            }

            if (response.ok) {
                window.app.closeModal();
                await this.loadCharacters(this.currentProjectId);
                window.app.showNotification(
                    characterId ? '角色已更新' : '角色已创建',
                    'success'
                );
            } else {
                const error = await response.json();
                throw new Error(error.error || '保存失败');
            }
        } catch (error) {
            console.error('Failed to save character:', error);
            window.app.showNotification('保存角色失败: ' + error.message, 'error');
        }
    }

    async editCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (character) {
            this.showCharacterModal(character);
        }
    }

    async deleteCharacter(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;

        if (!confirm(`确定要删除角色 "${character.name}" 吗？此操作不可撤销。`)) {
            return;
        }

        try {
            const response = await fetch(`/api/characters/${characterId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadCharacters(this.currentProjectId);
                window.app.showNotification('角色已删除', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error || '删除失败');
            }
        } catch (error) {
            console.error('Failed to delete character:', error);
            window.app.showNotification('删除角色失败: ' + error.message, 'error');
        }
    }

    generateDialogue(characterId) {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) return;

        // Switch to writing module
        window.app.switchModule('writing');

        // Create a simple prompt for dialogue generation
        const situation = prompt(`请描述 ${character.name} 需要说话的情况:`);
        if (situation) {
            window.aiChatModule.generateCharacterDialogue(characterId, situation);
        }
    }

    // Export characters data
    exportCharacters() {
        if (this.characters.length === 0) {
            window.app.showNotification('没有角色数据可导出', 'warning');
            return;
        }

        const dataStr = JSON.stringify(this.characters, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `角色数据_${new Date().toLocaleDateString()}.json`;
        link.click();
        
        window.app.showNotification('角色数据已导出', 'success');
    }

    // Search characters
    searchCharacters(query) {
        const filteredCharacters = this.characters.filter(character => 
            character.name.toLowerCase().includes(query.toLowerCase()) ||
            (character.description && character.description.toLowerCase().includes(query.toLowerCase())) ||
            (character.personality && character.personality.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderFilteredCharacters(filteredCharacters);
    }

    renderFilteredCharacters(characters) {
        const container = document.getElementById('charactersGrid');
        container.innerHTML = '';

        characters.forEach(character => {
            const characterCard = this.createCharacterCard(character);
            container.appendChild(characterCard);
        });

        if (characters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-muted">没有找到匹配的角色</p>
                </div>
            `;
        }
    }

    // Utility functions
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.charactersModule = new CharactersModule();
});