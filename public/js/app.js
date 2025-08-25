// Main Application Controller
class ChineseNovelApp {
    constructor() {
        this.currentProject = null;
        this.currentChapter = null;
        this.currentModule = 'writing';
        this.autoSaveInterval = null;
        
        this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadProjects();
        this.switchModule('writing');
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const module = e.target.closest('.nav-link').dataset.module;
                this.switchModule(module);
            });
        });

        // Project management
        document.getElementById('newProjectBtn').addEventListener('click', () => {
            this.showProjectModal();
        });

        document.getElementById('projectSelect').addEventListener('change', (e) => {
            const projectId = e.target.value;
            if (projectId) {
                this.loadProject(projectId);
            }
        });

        document.getElementById('projectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createProject();
        });

        // Chapter management
        document.getElementById('newChapterBtn').addEventListener('click', () => {
            this.createNewChapter();
        });

        document.getElementById('chapterSelect').addEventListener('change', (e) => {
            const chapterId = e.target.value;
            if (chapterId) {
                this.loadChapter(chapterId);
            }
        });

        // Auto-save
        document.getElementById('chapterEditor').addEventListener('input', () => {
            this.scheduleAutoSave();
            this.updateWordCount();
        });

        document.getElementById('chapterTitle').addEventListener('input', () => {
            this.scheduleAutoSave();
        });

        // Manual save
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveCurrentChapter();
        });

        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveCurrentChapter();
                        break;
                    case 'n':
                        e.preventDefault();
                        if (e.shiftKey) {
                            this.createNewChapter();
                        } else {
                            this.showProjectModal();
                        }
                        break;
                }
            }
        });
    }

    switchModule(moduleName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-module="${moduleName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.module').forEach(module => {
            module.classList.remove('active');
        });
        document.getElementById(`${moduleName}Module`).classList.add('active');

        this.currentModule = moduleName;

        // Load module-specific data
        this.loadModuleData(moduleName);
    }

    async loadModuleData(moduleName) {
        if (!this.currentProject) return;

        switch (moduleName) {
            case 'chapters':
                await window.chaptersModule.loadChapters(this.currentProject.project.id);
                break;
            case 'characters':
                await window.charactersModule.loadCharacters(this.currentProject.project.id);
                break;
            case 'world':
                await window.worldModule.loadWorldBuilding(this.currentProject.project.id);
                break;
            case 'structure':
                await window.structureModule.loadStructure(this.currentProject.project.id);
                break;
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            const projects = await response.json();
            
            const select = document.getElementById('projectSelect');
            select.innerHTML = '<option value="">选择项目...</option>';
            
            projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = project.name;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load projects:', error);
            this.showNotification('加载项目失败', 'error');
        }
    }

    async loadProject(projectId) {
        try {
            const response = await fetch(`/api/projects/${projectId}`);
            const projectData = await response.json();
            
            this.currentProject = projectData;
            this.updateProjectStats();
            this.loadChaptersList();
            this.loadModuleData(this.currentModule);
            
            this.showNotification(`已加载项目: ${projectData.project.name}`, 'success');
        } catch (error) {
            console.error('Failed to load project:', error);
            this.showNotification('加载项目失败', 'error');
        }
    }

    loadChaptersList() {
        const select = document.getElementById('chapterSelect');
        select.innerHTML = '<option value="">选择章节...</option>';
        
        if (this.currentProject && this.currentProject.chapters) {
            this.currentProject.chapters.forEach(chapter => {
                const option = document.createElement('option');
                option.value = chapter.id;
                option.textContent = `第${chapter.order_index}章 - ${chapter.title}`;
                select.appendChild(option);
            });
        }
    }

    async loadChapter(chapterId) {
        try {
            const response = await fetch(`/api/chapters/${chapterId}`);
            const chapter = await response.json();
            
            this.currentChapter = chapter;
            document.getElementById('chapterTitle').value = chapter.title || '';
            document.getElementById('chapterEditor').value = chapter.content || '';
            
            this.updateWordCount();
            this.showNotification(`已加载章节: ${chapter.title}`, 'success');
        } catch (error) {
            console.error('Failed to load chapter:', error);
            this.showNotification('加载章节失败', 'error');
        }
    }

    async createNewChapter() {
        if (!this.currentProject) {
            this.showNotification('请先选择项目', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/chapters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    project_id: this.currentProject.project.id,
                    title: '新章节',
                    content: ''
                })
            });

            const chapter = await response.json();
            
            // Reload project data to get updated chapters list
            await this.loadProject(this.currentProject.project.id);
            
            // Load the new chapter
            await this.loadChapter(chapter.id);
            
            // Update chapter select
            document.getElementById('chapterSelect').value = chapter.id;
            
            this.showNotification('新章节已创建', 'success');
        } catch (error) {
            console.error('Failed to create chapter:', error);
            this.showNotification('创建章节失败', 'error');
        }
    }

    async saveCurrentChapter() {
        if (!this.currentChapter) {
            this.showNotification('没有选择章节', 'warning');
            return;
        }

        const title = document.getElementById('chapterTitle').value;
        const content = document.getElementById('chapterEditor').value;

        try {
            const response = await fetch(`/api/chapters/${this.currentChapter.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title,
                    content,
                    status: this.currentChapter.status || 'draft'
                })
            });

            const updatedChapter = await response.json();
            this.currentChapter = updatedChapter;
            
            this.showNotification('章节已保存', 'success');
            this.updateProjectStats();
        } catch (error) {
            console.error('Failed to save chapter:', error);
            this.showNotification('保存失败', 'error');
        }
    }

    scheduleAutoSave() {
        if (this.autoSaveInterval) {
            clearTimeout(this.autoSaveInterval);
        }
        
        this.autoSaveInterval = setTimeout(() => {
            if (this.currentChapter) {
                this.saveCurrentChapter();
            }
        }, 30000); // Auto-save every 30 seconds
    }

    updateWordCount() {
        const content = document.getElementById('chapterEditor').value;
        const wordCount = content.replace(/\s+/g, '').length;
        document.getElementById('wordCount').textContent = wordCount;
    }

    async updateProjectStats() {
        if (!this.currentProject) return;

        try {
            const response = await fetch(`/api/chapters/project/${this.currentProject.project.id}/stats`);
            const stats = await response.json();
            
            document.getElementById('totalWords').textContent = stats.total_words || 0;
            document.getElementById('totalChapters').textContent = stats.total_chapters || 0;
        } catch (error) {
            console.error('Failed to update project stats:', error);
        }
    }

    showProjectModal() {
        document.getElementById('projectModal').classList.add('active');
        document.getElementById('projectName').focus();
    }

    async createProject() {
        const name = document.getElementById('projectName').value;
        const description = document.getElementById('projectDescription').value;
        const genre = document.getElementById('projectGenre').value;

        if (!name.trim()) {
            this.showNotification('请输入项目名称', 'warning');
            return;
        }

        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, description, genre })
            });

            const project = await response.json();
            
            this.closeModal();
            await this.loadProjects();
            
            // Auto-select the new project
            document.getElementById('projectSelect').value = project.id;
            await this.loadProject(project.id);
            
            this.showNotification(`项目 "${name}" 已创建`, 'success');
        } catch (error) {
            console.error('Failed to create project:', error);
            this.showNotification('创建项目失败', 'error');
        }
    }

    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // Reset forms
        document.querySelectorAll('.modal form').forEach(form => {
            form.reset();
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            color: 'white',
            zIndex: '9999',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '300px',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });

        // Set background color based on type
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Global utilities
window.closeModal = function() {
    window.app.closeModal();
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChineseNovelApp();
});