// Story Structure Module - Basic Implementation
class StructureModule {
    constructor() {
        this.structureItems = [];
        this.currentProjectId = null;
    }

    async loadStructure(projectId) {
        this.currentProjectId = projectId;
        
        try {
            const response = await fetch(`/api/structure/project/${projectId}`);
            this.structureItems = await response.json();
            this.renderStructure();
        } catch (error) {
            console.error('Failed to load structure:', error);
            // Create placeholder structure for now
            this.renderPlaceholderStructure();
        }
    }

    renderStructure() {
        const container = document.getElementById('structureTimeline');
        container.innerHTML = '';

        if (this.structureItems.length === 0) {
            this.renderPlaceholderStructure();
            return;
        }

        this.structureItems.forEach(item => {
            const structureItem = document.createElement('div');
            structureItem.className = 'structure-item';
            structureItem.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.description || '暂无描述'}</p>
                <div class="structure-meta">
                    类型: ${item.type} • 顺序: ${item.order_index}
                </div>
            `;
            container.appendChild(structureItem);
        });
    }

    renderPlaceholderStructure() {
        const container = document.getElementById('structureTimeline');
        container.innerHTML = `
            <div class="empty-state">
                <p class="text-muted">故事结构功能正在开发中</p>
                <p class="text-muted">即将支持情节点、角色弧线和时间线管理</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.structureModule = new StructureModule();
});