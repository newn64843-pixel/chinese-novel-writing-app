// Chapters Module - Basic Implementation
class ChaptersModule {
    constructor() {
        this.chapters = [];
        this.currentProjectId = null;
    }

    async loadChapters(projectId) {
        this.currentProjectId = projectId;
        
        try {
            const response = await fetch(`/api/chapters/project/${projectId}`);
            this.chapters = await response.json();
            this.renderChapters();
        } catch (error) {
            console.error('Failed to load chapters:', error);
            window.app.showNotification('加载章节失败', 'error');
        }
    }

    renderChapters() {
        const container = document.getElementById('chaptersList');
        container.innerHTML = '';

        if (this.chapters.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-muted">还没有创建章节</p>
                </div>
            `;
            return;
        }

        this.chapters.forEach(chapter => {
            const chapterItem = document.createElement('div');
            chapterItem.className = 'chapter-item';
            chapterItem.innerHTML = `
                <div class="chapter-info">
                    <h4>第${chapter.order_index}章 - ${chapter.title}</h4>
                    <div class="chapter-meta">
                        ${chapter.word_count || 0} 字 • ${chapter.status || 'draft'} • 
                        ${new Date(chapter.updated_at).toLocaleDateString()}
                    </div>
                </div>
                <div class="chapter-actions">
                    <button class="btn btn-sm" onclick="window.app.loadChapter(${chapter.id})">
                        编辑
                    </button>
                </div>
            `;
            container.appendChild(chapterItem);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chaptersModule = new ChaptersModule();
});