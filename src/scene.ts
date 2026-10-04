import './scene.css'
import { sunPosition } from './lib'
import { FRAGMENT_SHADER, VERTEX_SHADER } from './shader'

const FACE_SIZE = 512
const COLOR_BACKGROUND = '#282828'
const COLOR_NORTH = '#b30000'
const COLOR_NEEDLE = '#f2f2f2'
// camera looks at the box from above, tilted that much off the vertical
const BASE_TILT = 36
// spring driving the needle, tuned to overshoot a little before settling
const STIFFNESS = 90
const DAMPING = 7
const REST_THRESHOLD = 0.02
const UNIFORMS = [
	'uResolution',
	'uTilt',
	'uYaw',
	'uFaceAngle',
	'uNeedleAngle',
	'uHasNeedle',
	'uNight',
	'uLight',
	'uLightColor',
] as const

type Uniforms = Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

function compile(gl: WebGLRenderingContext, type: number, source: string) {
	const shader = gl.createShader(type) as WebGLShader
	gl.shaderSource(shader, source)
	gl.compileShader(shader)
	return shader
}

/**
 * Compass rendered as a real, lit object: raymarched box with the face
 * of classic compass inside. Light follows the sun above map center.
 */
export class Scene {
	readonly element: HTMLDivElement
	#canvas: HTMLCanvasElement
	#gl: WebGLRenderingContext
	#uniforms!: Uniforms
	#face = document.createElement('canvas')
	#icon?: SVGSVGElement | null
	#observer: ResizeObserver
	#frame = 0
	#lastTick = 0

	#bearing = 0
	#pitch = 0
	#center: [number, number] = [0, 0]
	#hover = [0, 0]
	// camera swoops in from the side when compass shows up
	#tilt = 80
	#yaw = -140
	#needleAngle = 0
	#needleTarget = 0
	#needleVelocity = 0

	static create() {
		const canvas = document.createElement('canvas')
		const gl = canvas.getContext('webgl', {
			alpha: true,
			antialias: false,
			premultipliedAlpha: true,
		})
		return gl ? new Scene(canvas, gl) : undefined
	}

	private constructor(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
		const element = document.createElement('div')
		element.classList.add('compass-pro-scene')
		element.append(canvas)
		element.addEventListener('pointermove', this.#handlePointerMove)
		element.addEventListener('pointerleave', this.#handlePointerLeave)
		element.addEventListener('pointerdown', this.#handlePointerDown)
		canvas.addEventListener('webglcontextlost', this.#handleContextLost)
		canvas.addEventListener('webglcontextrestored', this.#handleContextRestored)

		this.element = element
		this.#canvas = canvas
		this.#gl = gl
		this.#face.width = this.#face.height = FACE_SIZE
		this.#setup()
		this.setIcon(null)

		this.#observer = new ResizeObserver(this.#invalidate)
		this.#observer.observe(canvas)
	}

	#setup() {
		const gl = this.#gl
		const program = gl.createProgram() as WebGLProgram
		gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
		gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER))
		gl.linkProgram(program)
		gl.useProgram(program)

		// single triangle covering the viewport
		gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 3, -1, -1, 3]),
			gl.STATIC_DRAW,
		)
		const position = gl.getAttribLocation(program, 'position')
		gl.enableVertexAttribArray(position)
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

		gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		this.#uniforms = Object.fromEntries(
			UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]),
		) as Uniforms
	}

	// flat face of classic compass, later wrapped on the bottom of the box
	#paintFace() {
		const context = this.#face.getContext('2d') as CanvasRenderingContext2D
		const radius = FACE_SIZE / 2

		context.resetTransform()
		context.fillStyle = COLOR_BACKGROUND
		context.fillRect(0, 0, FACE_SIZE, FACE_SIZE)
		context.translate(radius, radius)

		for (let i = 5; i >= 0; i--) {
			context.save()
			context.rotate(toRadians(i * 30))
			if (i === 3) {
				context.fillStyle = COLOR_NORTH
				context.fillRect(-9, -radius, 18, FACE_SIZE)
			}
			context.fillStyle = i === 0 ? COLOR_NORTH : COLOR_NEEDLE
			const width = i === 0 ? 20 : 10
			context.fillRect(-width / 2, -radius, width, FACE_SIZE)
			context.restore()
		}

		// shield with double border
		context.globalAlpha = 0.9
		context.fillStyle = COLOR_BACKGROUND
		context.beginPath()
		context.arc(0, 0, radius * 0.75, 0, 2 * Math.PI)
		context.fill()
		context.globalAlpha = 1
		context.strokeStyle = COLOR_NORTH
		context.lineWidth = 9
		for (const ring of [0.73, 0.665]) {
			context.beginPath()
			context.arc(0, 0, radius * ring, 0, 2 * Math.PI)
			context.stroke()
		}

		if (this.#icon) {
			this.#paintIcon(context, this.#icon, radius * 0.8)
		}

		const gl = this.#gl
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			this.#face,
		)
	}

	#paintIcon(
		context: CanvasRenderingContext2D,
		icon: SVGSVGElement,
		size: number,
	) {
		const path = icon.firstElementChild as SVGPathElement
		const [, , width, height] = (icon.getAttribute('viewBox') ?? '')
			.split(' ')
			.map(Number)
		const scale = size / Math.max(width, height)
		const [, turn = '0'] =
			/rotate\((-?\d+)\)/.exec(path.getAttribute('transform') ?? '') ?? []
		const outline = new Path2D(path.getAttribute('d') ?? '')

		context.save()
		context.scale(scale, scale)
		context.rotate(toRadians(Number(turn)))
		context.translate(-width / 2, -height / 2)
		context.fillStyle = path.getAttribute('fill') ?? COLOR_NEEDLE
		context.strokeStyle = path.getAttribute('stroke') ?? COLOR_NORTH
		context.lineWidth = 2
		context.lineJoin = 'round'
		context.fill(outline)
		context.stroke(outline)
		context.restore()
	}

	#handlePointerMove = ({ clientX, clientY }: PointerEvent) => {
		const { left, top, width, height } = this.element.getBoundingClientRect()
		this.#hover = [
			((clientX - left) / width) * 2 - 1,
			((clientY - top) / height) * 2 - 1,
		]
		this.#invalidate()
	}

	#handlePointerLeave = () => {
		this.#hover = [0, 0]
		this.#invalidate()
	}

	// flick the needle, it finds its way back on its own
	#handlePointerDown = () => {
		this.#needleVelocity += 500
		this.#invalidate()
	}

	#handleContextLost = (event: Event) => {
		event.preventDefault()
		cancelAnimationFrame(this.#frame)
		this.#frame = 0
	}

	#handleContextRestored = () => {
		this.#setup()
		this.#paintFace()
		this.#invalidate()
	}

	#invalidate = () => {
		if (!this.#frame && !this.#gl.isContextLost()) {
			this.#lastTick = performance.now()
			this.#frame = requestAnimationFrame(this.#tick)
		}
	}

	// moves everything what is animated, returns true once all came to rest
	#animate(elapsed: number) {
		const targetTilt = BASE_TILT + this.#pitch * 0.25 - this.#hover[1] * 7
		const targetYaw = this.#hover[0] * 14
		const offset = this.#needleAngle - this.#needleTarget

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			this.#tilt = targetTilt
			this.#yaw = targetYaw
			this.#needleAngle = this.#needleTarget
			this.#needleVelocity = 0
			return true
		}

		const ease = 1 - Math.exp(-9 * elapsed)
		this.#tilt += (targetTilt - this.#tilt) * ease
		this.#yaw += (targetYaw - this.#yaw) * ease

		const acceleration = -STIFFNESS * offset - DAMPING * this.#needleVelocity
		this.#needleVelocity += acceleration * elapsed
		this.#needleAngle += this.#needleVelocity * elapsed

		const isResting = [
			targetTilt - this.#tilt,
			targetYaw - this.#yaw,
			this.#needleAngle - this.#needleTarget,
			this.#needleVelocity,
		].every((value) => Math.abs(value) < REST_THRESHOLD)

		if (isResting) {
			this.#needleAngle = this.#needleTarget
			this.#needleVelocity = 0
		}
		return isResting
	}

	#tick = (now: number) => {
		const elapsed = Math.min((now - this.#lastTick) / 1000, 0.032)
		this.#lastTick = now
		this.#frame = this.#animate(elapsed) ? 0 : requestAnimationFrame(this.#tick)
		this.#draw()
	}

	#draw() {
		const gl = this.#gl
		const canvas = this.#canvas
		const ratio = Math.min(window.devicePixelRatio || 1, 2)
		const width = Math.round(canvas.clientWidth * ratio)
		const height = Math.round(canvas.clientHeight * ratio)

		if (!width || !height) {
			return
		}
		if (canvas.width !== width || canvas.height !== height) {
			canvas.width = width
			canvas.height = height
		}

		// sun as seen from the map center, turned the way the map is turned
		const { azimuth, altitude } = sunPosition(new Date(), ...this.#center)
		const night = Math.min(Math.max(-altitude / 6, 0), 1)
		const elevation = toRadians(Math.max(altitude, 50))
		const direction = toRadians(night === 1 ? -40 : azimuth - this.#bearing)
		// the lower the sun, the warmer the light
		const warmth = Math.min(Math.max((30 - altitude) / 30, 0), 1)
		const dim = 1 - 0.75 * night

		gl.viewport(0, 0, width, height)
		gl.uniform2f(this.#uniforms.uResolution, width, height)
		gl.uniform1f(this.#uniforms.uTilt, toRadians(this.#tilt))
		gl.uniform1f(this.#uniforms.uYaw, toRadians(this.#yaw))
		gl.uniform1f(this.#uniforms.uFaceAngle, toRadians(-this.#bearing))
		gl.uniform1f(this.#uniforms.uNeedleAngle, toRadians(this.#needleAngle))
		gl.uniform1f(this.#uniforms.uHasNeedle, this.#icon ? 0 : 1)
		gl.uniform1f(this.#uniforms.uNight, night)
		gl.uniform3f(
			this.#uniforms.uLight,
			Math.sin(direction) * Math.cos(elevation),
			Math.sin(elevation),
			-Math.cos(direction) * Math.cos(elevation),
		)
		gl.uniform3f(
			this.#uniforms.uLightColor,
			dim,
			dim * (1 - 0.22 * warmth * (1 - night)),
			dim * (1 - 0.45 * warmth * (1 - night) + 0.3 * night),
		)
		gl.drawArrays(gl.TRIANGLES, 0, 3)
	}

	/**
	 * @param bearing map bearing
	 * @param pitch map pitch, the more of it, the more from the side box is seen
	 * @param center [lng, lat] of map center, the sun is looked up for
	 * @param needleBearing geographic bearing the needle should point to
	 */
	update(
		bearing: number,
		pitch: number,
		center: [number, number],
		needleBearing = 0,
	) {
		this.#bearing = bearing
		this.#pitch = pitch
		this.#center = center

		// take the shortest way round
		const angle = needleBearing - bearing
		const delta = ((((angle - this.#needleTarget) % 360) + 540) % 360) - 180
		this.#needleTarget += delta
		this.#invalidate()
	}

	// cardinal direction icon takes place of the needle
	setIcon(icon: SVGSVGElement | null) {
		if (icon !== this.#icon) {
			this.#icon = icon
			this.#paintFace()
			this.#invalidate()
		}
	}

	destroy() {
		cancelAnimationFrame(this.#frame)
		this.#observer.disconnect()
		this.#gl.getExtension('WEBGL_lose_context')?.loseContext()
		this.element.remove()
	}
}
