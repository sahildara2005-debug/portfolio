/**
 * Advanced Task Manager Class Blueprint
 * Covers Step 2 (Logic), Step 3 (Events), Step 4 (Persistence), & Step 5 (Enhancements)
 */
class TaskManager {
    constructor() {
        // Step 2 & 4: Initialize explicit state arrays or pull fresh from LocalStorage
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        // DOM Element Cache
        this.taskList = document.getElementById('taskList');
        this.taskForm = document.getElementById('taskForm');
        this.taskInput = document.getElementById('taskInput');
        this.taskPriority = document.getElementById('taskPriority');
        this.taskDueDate = document.getElementById('taskDueDate');
        this.searchBar = document.getElementById('searchBar');
        this.filterControls = document.getElementById('filterControls');
        this.clearCompletedBtn = document.getElementById('clearCompletedBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.backupBtn = document.getElementById('backupBtn');
        this.restoreFile = document.getElementById('restoreFile');

        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupDragAndDrop();
        this.render();
    }
    
    /* ==========================================================================
       STEP 3: EVENT HANDLING & INTERACTION MANAGEMENT
       ========================================================================== */
    setupEventListeners() {
        // Form Interception
        this.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask(this.taskInput.value);
            this.taskForm.reset();
        });

        // Event Delegation Pattern for list modifications
        this.taskList.addEventListener('click', (e) => {
            const target = e.target;
            const taskItem = target.closest('.task-item');
            if (!taskItem) return;
            const id = Number(taskItem.dataset.id);

            if (target.classList.contains('task-checkbox')) {
                this.toggleComplete(id);
            } else if (target.classList.contains('delete-btn')) {
                this.deleteTask(id);
            } else if (target.classList.contains('edit-btn')) {
                this.enableInlineEditing(taskItem, id);
            }
        });

        // Filter Controls Tracking
        this.filterControls.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.classList.contains('filter-btn')) return;
            
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            this.currentFilter = target.dataset.filter;
            this.render();
        });

        // Search Typing Listener
        this.searchBar.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase().trim();
            this.render();
        });

        // Clear Functionality Engagement
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());

        // Step 4: Backup Utility Actions
        this.backupBtn.addEventListener('click', () => this.exportBackupJSON());
        this.restoreFile.addEventListener('change', (e) => this.importBackupJSON(e));

        // Step 5: Global Layout Theme Toggle 
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Global Accessible Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            // Option/Alt + N to immediately snap focus right to Task Input fields
            if (e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                this.taskInput.focus();
            }
        });
    }

    /* ==========================================================================
       STEP 2 & 4: STATE BUSINESS LOGIC & DATA PERSISTENCE
       ========================================================================== */
    addTask(text) {
        const task = {
            id: Date.now(),
            text: text.trim(),
            completed: false,
            priority: this.taskPriority.value,
            dueDate: this.taskDueDate.value || null,
            order: this.tasks.length
        };
        
        this.tasks.push(task);
        this.syncState();
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.syncState();
    }
    
    toggleComplete(id) {
        this.tasks = this.tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.syncState();
    }

    enableInlineEditing(taskItem, id) {
        const textSpan = taskItem.querySelector('.task-text');
        textSpan.contentEditable = true;
        textSpan.focus();
        
        // Place text cursor cleanly right at the end of text contents
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(textSpan);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);

        const saveChanges = () => {
            textSpan.contentEditable = false;
            const updatedText = textSpan.textContent.trim();
            if (updatedText) {
                this.tasks = this.tasks.map(t => t.id === id ? { ...t, text: updatedText } : t);
                this.syncState();
            } else {
                this.deleteTask(id);
            }
        };

        textSpan.addEventListener('blur', saveChanges, { once: true });
        textSpan.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                textSpan.blur();
            }
        });
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
        this.syncState();
    }

    syncState() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.render();
    }

    /* ==========================================================================
       STEP 4: UTILITY FILE ENGINE (JSON STORAGE HANDLING)
       ========================================================================== */
    exportBackupJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.tasks, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `tasks-backup-${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    importBackupJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.tasks = importedData;
                    this.syncState();
                    alert("✅ Task database restored successfully!");
                } else {
                    throw new Error("Invalid format shape structure");
                }
            } catch (err) {
                alert("❌ Critical Error reading data parsing layout. Ensure validity of file source structural arrays.");
            }
        };
        reader.readAsText(file);
    }

    /* ==========================================================================
       STEP 5: GRAPHICAL SYSTEM MODES & DRAG/DROP ALGORITHMS
       ========================================================================== */
    setupTheme() {
        const currentSavedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentSavedTheme);
    }

    toggleTheme() {
        const currentActive = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentActive === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
    }

    setupDragAndDrop() {
        // Tracks list reordering dynamically 
        this.taskList.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.task-item');
            if (item) item.classList.add('dragging');
        });

        this.taskList.addEventListener('dragend', (e) => {
            const item = e.target.closest('.task-item');
            if (item) {
                item.classList.remove('dragging');
                this.recalculateDragOrders();
            }
        });

        this.taskList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingEl = document.querySelector('.dragging');
            if (!draggingEl) return;

            // Find immediate element directly below vertical coordinates position boundary shifts
            const immediateSibling = this.getDragAfterElement(this.taskList, e.clientY);
            if (immediateSibling == null) {
                this.taskList.appendChild(draggingEl);
            } else {
                this.taskList.insertBefore(draggingEl, immediateSibling);
            }
        });
    }

    getDragAfterElement(container, yCoordinate) {
        const staticDraggableItems = [...container.querySelectorAll('.task-item:not(.dragging)')];
        
        return staticDraggableItems.reduce((closest, child) => {
            const boxBounding = child.getBoundingClientRect();
            const offsetDist = yCoordinate - boxBounding.top - boxBounding.height / 2;
            if (offsetDist < 0 && offsetDist > closest.offset) {
                return { offset: offsetDist, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    recalculateDragOrders() {
        const activeDomItems = [...this.taskList.querySelectorAll('.task-item')];
        const updatedOrderedArray = [];

        activeDomItems.forEach((domNode, index) => {
            const matchId = Number(domNode.dataset.id);
            const foundObjectReference = this.tasks.find(t => t.id === matchId);
            if (foundObjectReference) {
                foundObjectReference.order = index;
                updatedOrderedArray.push(foundObjectReference);
            }
        });

        // Reinsert non-visible filtered targets directly back up to tail positions
        this.tasks.forEach(t => {
            if (!updatedOrderedArray.some(u => u.id === t.id)) {
                updatedOrderedArray.push(t);
            }
        });

        this.tasks = updatedOrderedArray;
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateStats(); 
    }

    /* ==========================================================================
       VIEW DOM RENDERING SYSTEMS
       ========================================================================== */
    getFilteredAndSearchedTasks() {
        // First sort tasks globally by chronological user dragging configurations arrays
        let processedTasks = [...this.tasks].sort((first, second) => first.order - second.order);

        // Run Filter Pipeline Match
        if (this.currentFilter === 'active') {
            processedTasks = processedTasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            processedTasks = processedTasks.filter(t => t.completed);
        }

        // Run Search Term Filtering Pipeline
        if (this.searchQuery) {
            processedTasks = processedTasks.filter(t => t.text.toLowerCase().includes(this.searchQuery));
        }

        return processedTasks;
    }

    render() {
        const targetViewTasks = this.getFilteredAndSearchedTasks();
        
        if (targetViewTasks.length === 0) {
            this.taskList.innerHTML = `<li class="task-item" draggable="false" style="justify-content: center; color: var(--text-muted);">No tasks match criteria. Try writing one!</li>`;
            this.updateStats();
            return;
        }

        this.taskList.innerHTML = targetViewTasks.map(task => {
            const displayDate = task.dueDate ? `📅 Due: ${task.dueDate}` : '';
            const urgencyFlag = task.priority === 'high' ? '🚨' : task.priority === 'medium' ? '⚡' : '🌱';
            
            return `
                <li class="task-item p-${task.priority} ${task.completed ? 'completed' : ''}" data-id="${task.id}" draggable="true">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark completed">
                    <div class="task-content">
                        <span class="task-text">${task.text}</span>
                        <div class="task-meta">
                            <span>${urgencyFlag} ${task.priority.toUpperCase()}</span>
                            ${displayDate ? `<span>${displayDate}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="action-btn edit-btn" title="Edit content">✏️</button>
                        <button class="action-btn delete-btn" title="Remove object item">🗑️</button>
                    </div>
                </li>
            `;
        }).join('');

        this.updateStats();
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const active = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('activeTasks').textContent = active;
    }
}

// Instantiate Global Class Run Instance Configuration mapping objects on DOM Content Completion signals
document.addEventListener('DOMContentLoaded', () => {
    window.appManagerInstance = new TaskManager();
});