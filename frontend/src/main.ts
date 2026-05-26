import App from './ui/App.svelte'
import { agentStore } from './stores/agentStore'

agentStore.connect()

const app = new App({
  target: document.getElementById('app')!,
})

export default app
