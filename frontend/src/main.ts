import { mount } from 'svelte'
import App from './ui/App.svelte'
import { agentStore } from './stores/agentStore'

const app = mount(App, {
  target: document.getElementById('app')!,
})

agentStore.connect()

export default app
