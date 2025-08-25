// World Building Module - Basic Implementation
class WorldModule {
    constructor() {
        this.worldElements = [];
        this.currentProjectId = null;
        this.currentType = 'location';
    }

    async loadWorldBuilding(projectId) {
        this.currentProjectId = projectId;
        
        try {
            const response = await fetch(`/api/world/project/${projectId}`);
            this.worldElements = await response.json();
            this.renderWorldElements();
        } catch (error) {
            console.error('Failed to load world building:', error);
            window.app.showNotification('加载世界设定失败', 'error');
        }
    }

    renderWorldElements() {
        const container = document.getElementById('worldContent');
        container.innerHTML = '';

        const filteredElements = this.worldElements.filter(element => 
            element.type === this.currentType
        );

        if (filteredElements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="text-muted">还没有创建${this.getTypeLabel()}设定</p>
                </div>
            `;
            return;
        }

        filteredElements.forEach(element => {
            const worldItem = document.createElement('div');
            worldItem.className = 'world-item';
            worldItem.innerHTML = `
                <div class="world-type">${this.getTypeLabel()}</div>
                <h4>${element.name}</h4>
                <p>${element.description || '暂无描述'}</p>
            `;
            container.appendChild(worldItem);
        });
    }

    getTypeLabel() {
        const labels = {
            location: '地点',
            culture: '文化',
            rule: '规则',
            organization: '组织'
        };
        return labels[this.currentType] || this.currentType;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.worldModule = new WorldModule();
    
    // Bind tab events
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            window.worldModule.currentType = e.target.dataset.type;
            window.worldModule.renderWorldElements();
        });
    });
});