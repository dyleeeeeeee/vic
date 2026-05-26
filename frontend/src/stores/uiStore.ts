type Listener = () => void

class UIStore {
  selectedAgentId: string | null = null
  hoveredAgentId: string | null = null
  sidebarOpen = false
  createModalOpen = false
  private listeners: Set<Listener> = new Set()

  selectAgent(id: string | null) {
    this.selectedAgentId = id
    this.sidebarOpen = id !== null
    this.notify()
  }

  hoverAgent(id: string | null) {
    this.hoveredAgentId = id
    this.notify()
  }

  openCreateModal() {
    this.createModalOpen = true
    this.notify()
  }

  closeCreateModal() {
    this.createModalOpen = false
    this.notify()
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private notify() {
    for (const fn of this.listeners) fn()
  }
}

export const uiStore = new UIStore()
