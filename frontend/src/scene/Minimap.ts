import * as THREE from 'three'

export class Minimap {
  private miniCamera: THREE.OrthographicCamera
  private renderTarget: THREE.WebGLRenderTarget
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private size = 120

  constructor(
    private renderer: THREE.WebGLRenderer,
    private scene: THREE.Scene,
    private mainCamera: THREE.OrthographicCamera,
    private container: HTMLElement
  ) {
    const extent = 20
    this.miniCamera = new THREE.OrthographicCamera(-extent, extent, extent, -extent, 0.1, 100)
    this.miniCamera.position.set(0, 50, 0)
    this.miniCamera.lookAt(0, 0, 0)

    this.renderTarget = new THREE.WebGLRenderTarget(this.size * 2, this.size * 2)

    this.canvas = document.createElement('canvas')
    this.canvas.width = this.size
    this.canvas.height = this.size
    this.canvas.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 11px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(39, 39, 41, 0.85);
      backdrop-filter: saturate(180%) blur(20px);
      pointer-events: none;
      z-index: 50;
    `
    this.ctx = this.canvas.getContext('2d')!
    this.container.appendChild(this.canvas)
  }

  render() {
    const currentTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(this.scene, this.miniCamera)
    this.renderer.setRenderTarget(currentTarget)

    // Read pixels and draw to the 2D canvas
    const pixels = new Uint8Array(this.size * 2 * this.size * 2 * 4)
    this.renderer.readRenderTargetPixels(this.renderTarget, 0, 0, this.size * 2, this.size * 2, pixels)

    const imageData = this.ctx.createImageData(this.size * 2, this.size * 2)
    // Flip vertically (WebGL reads bottom-up)
    for (let y = 0; y < this.size * 2; y++) {
      const srcRow = (this.size * 2 - 1 - y) * this.size * 2 * 4
      const dstRow = y * this.size * 2 * 4
      for (let x = 0; x < this.size * 2 * 4; x++) {
        imageData.data[dstRow + x] = pixels[srcRow + x]
      }
    }

    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = this.size * 2
    tempCanvas.height = this.size * 2
    tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0)

    this.ctx.clearRect(0, 0, this.size, this.size)
    this.ctx.drawImage(tempCanvas, 0, 0, this.size, this.size)

    // Draw viewport rectangle
    this.drawViewportRect()
  }

  private drawViewportRect() {
    const extent = 20
    const cam = this.mainCamera

    const left = (-cam.left / (cam.right - cam.left)) * this.size
    const right = (-cam.right / (cam.right - cam.left)) * this.size
    const top = (cam.top / (cam.top - cam.bottom)) * this.size
    const bottom = (cam.bottom / (cam.top - cam.bottom)) * this.size

    const scale = this.size / (extent * 2)
    const w = Math.abs(cam.right - cam.left) * scale / cam.zoom
    const h = Math.abs(cam.top - cam.bottom) * scale / cam.zoom

    const cx = this.size / 2
    const cy = this.size / 2

    this.ctx.strokeStyle = '#0066cc'
    this.ctx.lineWidth = 1.5
    this.ctx.strokeRect(cx - w / 2, cy - h / 2, w, h)
  }

  dispose() {
    this.container.removeChild(this.canvas)
    this.renderTarget.dispose()
  }
}
