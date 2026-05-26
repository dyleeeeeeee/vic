import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.8 },
    darkness: { value: 1.2 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - 0.5) * 2.0;
      float vignette = 1.0 - dot(uv, uv) * darkness;
      vignette = clamp(vignette, 0.0, 1.0);
      vignette = smoothstep(0.0, offset, vignette);
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `,
}

export class ScreenshotMode {
  private composer: EffectComposer | null = null
  private active = false

  setup(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer)
    this.composer.addPass(new RenderPass(scene, camera))
    const vignettePass = new ShaderPass(VignetteShader)
    this.composer.addPass(vignettePass)
  }

  get isActive() {
    return this.active
  }

  enter() {
    this.active = true
  }

  exit() {
    this.active = false
  }

  render() {
    if (this.active && this.composer) {
      this.composer.render()
    }
  }

  capture(renderer: THREE.WebGLRenderer): string {
    const canvas = renderer.domElement
    return canvas.toDataURL('image/png')
  }

  download(renderer: THREE.WebGLRenderer) {
    const dataUrl = this.capture(renderer)
    const link = document.createElement('a')
    link.download = `vic-screenshot-${Date.now()}.png`
    link.href = dataUrl
    link.click()
  }
}
