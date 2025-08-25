// Editor Module - Enhanced Editor Features
class EditorModule {
    constructor() {
        this.isAutoSaveEnabled = true;
        this.autoSaveInterval = 30000; // 30 seconds
        this.autoSaveTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupAutoSave();
    }

    bindEvents() {
        const editor = document.getElementById('chapterEditor');
        const title = document.getElementById('chapterTitle');

        // Word count update
        editor.addEventListener('input', () => {
            this.updateWordCount();
            this.scheduleAutoSave();
        });

        title.addEventListener('input', () => {
            this.scheduleAutoSave();
        });

        // Text formatting shortcuts
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        this.toggleFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.toggleFormat('italic');
                        break;
                }
            }
        });
    }

    updateWordCount() {
        const editor = document.getElementById('chapterEditor');
        const content = editor.value;
        const wordCount = content.replace(/\s+/g, '').length;
        
        document.getElementById('wordCount').textContent = wordCount.toLocaleString();
    }

    setupAutoSave() {
        // Auto-save functionality is handled in the main app
        // This is just for additional editor-specific features
    }

    scheduleAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setTimeout(() => {
            this.autoSave();
        }, this.autoSaveInterval);
    }

    async autoSave() {
        if (window.app && window.app.currentChapter) {
            await window.app.saveCurrentChapter();
        }
    }

    toggleFormat(format) {
        // Basic text formatting (for future enhancement)
        console.log(`Toggle ${format} formatting`);
    }

    // Insert text at cursor position
    insertText(text) {
        const editor = document.getElementById('chapterEditor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        const value = editor.value;
        editor.value = value.slice(0, start) + text + value.slice(end);
        
        // Restore cursor position
        editor.selectionStart = editor.selectionEnd = start + text.length;
        editor.focus();
        
        this.updateWordCount();
        this.scheduleAutoSave();
    }

    // Get selected text
    getSelectedText() {
        const editor = document.getElementById('chapterEditor');
        return editor.value.substring(editor.selectionStart, editor.selectionEnd);
    }

    // Replace selected text
    replaceSelectedText(newText) {
        const editor = document.getElementById('chapterEditor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        const value = editor.value;
        editor.value = value.slice(0, start) + newText + value.slice(end);
        
        // Select the new text
        editor.selectionStart = start;
        editor.selectionEnd = start + newText.length;
        editor.focus();
        
        this.updateWordCount();
        this.scheduleAutoSave();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.editorModule = new EditorModule();
});