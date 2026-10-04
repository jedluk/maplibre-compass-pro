export const VERTEX_SHADER = `
attribute vec2 position;
void main() {
	gl_Position = vec4(position, 0.0, 1.0);
}`

// Whole compass is a signed distance field, raymarched per pixel:
// lacquered octagonal box, well with the face lying on its bottom,
// needle floating above it and a glass dome closing the well.
export const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 uResolution;
uniform float uTilt;
uniform float uYaw;
uniform float uFaceAngle;
uniform float uNeedleAngle;
uniform float uHasNeedle;
uniform float uNight;
uniform vec3 uLight;
uniform vec3 uLightColor;
uniform sampler2D uFace;

const float PI = 3.14159265;
const float BOX_R = 1.3;
const float BOX_H = 0.62;
const float WELL_R = 1.0;
const float WELL_D = 0.36;
const float PLATE_R = 0.75;
const float PLATE_H = 0.07;
const float DOME_H = 0.2;
const vec3 RED = vec3(0.45, 0.0, 0.0);
const vec3 WHITE = vec3(0.88, 0.87, 0.84);
const vec3 LUME = vec3(0.3, 1.0, 0.5);

mat2 rotation(float a) {
	float c = cos(a), s = sin(a);
	return mat2(c, -s, s, c);
}

float sdOctagon(vec2 p, float r) {
	const vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623);
	p = abs(p);
	p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
	p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
	p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
	return length(p) * sign(p.y);
}

float ndot(vec2 a, vec2 b) {
	return a.x * b.x - a.y * b.y;
}

float sdRhombus(vec2 p, vec2 b) {
	p = abs(p);
	float h = clamp(ndot(b - 2.0 * p, b) / dot(b, b), -1.0, 1.0);
	float d = length(p - 0.5 * b * vec2(1.0 - h, 1.0 + h));
	return d * sign(p.x * b.y + p.y * b.x - b.x * b.y);
}

// 2d shape pulled along y axis, with rounded edges
float extrude(float shape, float y, float halfHeight, float radius) {
	vec2 d = vec2(shape + radius, abs(y) - halfHeight + radius);
	return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - radius;
}

// the very same needle classic compass has: rhombus, hollow at its south half
float sdNeedle(vec2 p) {
	float rhombus = sdRhombus(p, vec2(0.22, 0.67));
	float hollow = max(rhombus + 0.075, 0.07 - p.y);
	return max(rhombus, -hollow);
}

// x: distance, y: material (1 body, 2 chrome, 3 needle)
vec2 map(vec3 p) {
	float r = length(p.xz);

	float box = extrude(sdOctagon(p.xz, BOX_R), p.y + BOX_H * 0.5, BOX_H * 0.5, 0.05);
	float well = max(r - WELL_R, -WELL_D - p.y);
	vec2 res = vec2(max(box, -well), 1.0);

	float plate = extrude(r - PLATE_R, p.y + WELL_D - PLATE_H * 0.5, PLATE_H * 0.5, 0.02);
	res.x = min(res.x, plate);

	float bezel = length(vec2(r - WELL_R - 0.05, p.y + 0.01)) - 0.075;
	if (bezel < res.x) res = vec2(bezel, 2.0);

	if (uHasNeedle > 0.5) {
		float needle = extrude(sdNeedle(rotation(uNeedleAngle) * p.xz), p.y + 0.14, 0.022, 0.008);
		if (needle < res.x) res = vec2(needle, 3.0);
	}
	return res;
}

vec3 normalAt(vec3 p) {
	vec2 e = vec2(0.0015, 0.0);
	return normalize(vec3(
		map(p + e.xyy).x - map(p - e.xyy).x,
		map(p + e.yxy).x - map(p - e.yxy).x,
		map(p + e.yyx).x - map(p - e.yyx).x
	));
}

float softShadow(vec3 origin, vec3 direction) {
	float res = 1.0;
	float t = 0.03;
	for (int i = 0; i < 28; i++) {
		float h = map(origin + direction * t).x;
		res = min(res, 9.0 * h / t);
		t += clamp(h, 0.02, 0.25);
		if (res < 0.005 || t > 4.0) break;
	}
	return clamp(res, 0.0, 1.0);
}

float occlusion(vec3 p, vec3 n) {
	float occ = 0.0;
	float scale = 1.0;
	for (int i = 0; i < 5; i++) {
		float h = 0.02 + 0.09 * float(i);
		occ += (h - map(p + n * h).x) * scale;
		scale *= 0.75;
	}
	return clamp(1.0 - 1.6 * occ, 0.0, 1.0);
}

// what gets mirrored in lacquer, chrome and glass,
// lights: 0.0 leaves light sources out, so nothing glares back
vec3 environment(vec3 d, float lights) {
	// photo studio rather than open sky: dark walls, bright horizon line
	vec3 sky = mix(vec3(0.42, 0.44, 0.48), vec3(0.05, 0.06, 0.08), smoothstep(0.0, 0.45, d.y));
	vec3 ground = mix(vec3(0.1, 0.09, 0.08), vec3(0.01), smoothstep(0.0, -0.5, d.y));
	vec3 color = mix(ground, sky, smoothstep(-0.02, 0.02, d.y));
	// softbox overhead, keeps reflections alive wherever the sun is
	color += lights * vec3(1.8) * smoothstep(0.8, 0.86, d.y) * smoothstep(0.55, 0.35, abs(d.x));
	color *= mix(1.0, 0.08, uNight);
	color += lights * uLightColor * 4.0 * pow(max(dot(d, uLight), 0.0), 350.0);
	return color;
}

float band(float x, float center, float halfWidth) {
	return 1.0 - smoothstep(halfWidth - 0.008, halfWidth + 0.008, abs(x - center));
}

// white inlays framing each wall of the box, red rhombus in the middle
vec3 lacquer(vec3 p, vec3 n, out float glow) {
	float r = length(p.xz);
	float angle = atan(p.z, p.x);
	float white = 0.0;
	float red = 0.0;

	if (n.y > 0.7 && r > WELL_R) {
		float edge = -sdOctagon(p.xz, BOX_R);
		float corner = mod(angle, PI / 4.0) - PI / 8.0;
		white = band(edge, 0.075, 0.022);
		white = max(white, band(r * sin(corner), 0.0, 0.02) * step(0.075, edge));
	} else if (abs(n.y) < 0.7 && r > WELL_R + 0.1) {
		float wall = mod(angle + PI / 8.0, PI / 4.0) - PI / 8.0;
		float u = BOX_R * tan(wall);
		float edge = min(BOX_R * 0.41421 - abs(u), min(-p.y, p.y + BOX_H));
		white = band(edge, 0.085, 0.022);
		red = 1.0 - smoothstep(-0.008, 0.008, sdNeedle(vec2(p.y + BOX_H * 0.5, u) * 2.4) / 2.4);
	}
	glow = white;
	return mix(mix(vec3(0.02), WHITE, white), RED, red);
}

vec3 shade(vec3 p, vec3 rd, float material) {
	vec3 n = normalAt(p);
	vec3 albedo = vec3(0.0);
	vec3 specular = vec3(0.05);
	vec3 emissive = vec3(0.0);
	float gloss = 60.0;
	float lights = 1.0;
	// how hard the sun glints off the surface
	float glint = 8.0;

	if (material < 1.5) {
		if (length(p.xz) < WELL_R - 0.01 && n.y > 0.5) {
			// face of the compass, turning along with the map
			vec2 uv = rotation(uFaceAngle) * p.xz / (2.0 * WELL_R) + 0.5;
			albedo = pow(texture2D(uFace, uv).rgb, vec3(2.2));
			float white = smoothstep(0.35, 0.7, min(albedo.r, min(albedo.g, albedo.b)));
			emissive = LUME * white * uNight;
			// matte, no glare is allowed to cover what compass shows
			specular = vec3(0.012);
			lights = 0.0;
		} else {
			float glow;
			albedo = lacquer(p, n, glow);
			emissive = LUME * glow * uNight * 0.5;
			gloss = 120.0;
			// flat walls would turn white as a whole once they face the sun
			glint = 1.0;
		}
	} else if (material < 2.5) {
		albedo = vec3(0.01);
		specular = vec3(0.62, 0.63, 0.66);
		gloss = 200.0;
	} else {
		// needle stays red whatever the light, it is what compass is read by
		albedo = RED;
		specular = vec3(0.06);
		lights = 0.0;
	}

	float shadow = softShadow(p + n * 0.01, uLight);
	float occ = occlusion(p, n);
	float diffuse = max(dot(n, uLight), 0.0) * shadow;
	vec3 mirrored = reflect(rd, n);
	float fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
	vec3 reflectance = specular + (1.0 - specular) * fresnel;
	float highlight = pow(max(dot(mirrored, uLight), 0.0), gloss) * shadow * lights;
	vec3 ambient = mix(vec3(0.5, 0.55, 0.65), vec3(0.04, 0.06, 0.12), uNight) * (0.6 + 0.4 * n.y);

	vec3 color = albedo * (uLightColor * diffuse * 2.4 + ambient * occ);
	color += environment(mirrored, lights) * reflectance * occ;
	color += uLightColor * highlight * specular * glint;
	return color + emissive;
}

// distance to glass dome along the ray, -1.0 when missed
float hitDome(vec3 ro, vec3 rd, out vec3 n) {
	float rim = WELL_R + 0.03;
	float radius = (rim * rim + DOME_H * DOME_H) / (2.0 * DOME_H);
	vec3 center = vec3(0.0, DOME_H - radius, 0.0);
	vec3 oc = ro - center;
	float b = dot(oc, rd);
	float discriminant = b * b - dot(oc, oc) + radius * radius;
	if (discriminant < 0.0) return -1.0;
	float t = -b - sqrt(discriminant);
	vec3 p = ro + rd * t;
	if (p.y < 0.0) return -1.0;
	n = normalize(p - center);
	return t;
}

vec4 render(vec2 uv) {
	vec3 target = vec3(0.0, -0.3, 0.0);
	vec3 ro = target + 12.0 * vec3(sin(uYaw) * sin(uTilt), cos(uTilt), cos(uYaw) * sin(uTilt));
	vec3 forward = normalize(target - ro);
	vec3 right = normalize(cross(forward, vec3(0.0, 1.0, 0.0)));
	vec3 up = cross(right, forward);
	vec3 rd = normalize(forward * 8.0 + uv.x * right + uv.y * up);

	float t = 9.0;
	float material = 0.0;
	for (int i = 0; i < 90; i++) {
		vec2 hit = map(ro + rd * t);
		if (hit.x < 0.0008 * t) {
			material = hit.y;
			break;
		}
		t += hit.x;
		if (t > 16.0) break;
	}

	vec3 color = vec3(0.0);
	float alpha = 0.0;

	if (material > 0.5) {
		color = shade(ro + rd * t, rd, material);
		alpha = 1.0;
	} else {
		// nothing hit, yet the box still drops its shadow on the map
		float ground = -(ro.y + BOX_H) / rd.y;
		vec3 p = ro + rd * ground;
		float shadow = 1.0 - softShadow(p + vec3(0.0, 0.01, 0.0), uLight);
		float contact = exp(-6.0 * max(sdOctagon(p.xz, BOX_R), 0.0));
		alpha = clamp(shadow * 0.42 + contact * 0.35, 0.0, 0.7);
		// never let the shadow get cut by the edge of the canvas
		vec2 margin = abs(uv) / vec2(uResolution.x / uResolution.y, 1.0);
		alpha *= smoothstep(1.0, 0.75, max(margin.x, margin.y));
		t = 100.0;
	}

	vec3 n;
	float dome = hitDome(ro, rd, n);
	if (dome > 0.0 && dome < t) {
		float fresnel = 0.03 + 0.97 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
		vec3 mirrored = reflect(rd, n);
		// glass mirrors the room only, never the lights
		vec3 glare = environment(mirrored, 0.0) * fresnel;
		color = color * alpha * (1.0 - fresnel) + glare;
		alpha = clamp(alpha + fresnel + dot(glare, vec3(0.33)), 0.0, 1.0);
		return vec4(color, alpha);
	}
	return vec4(color * alpha, alpha);
}

void main() {
	vec4 total = vec4(0.0);
	for (int x = 0; x < 2; x++) {
		for (int y = 0; y < 2; y++) {
			vec2 coord = gl_FragCoord.xy + (vec2(float(x), float(y)) - 0.5) * 0.5;
			total += render((coord * 2.0 - uResolution) / uResolution.y);
		}
	}
	total *= 0.25;
	// premultiplied alpha, gamma applied on straight color
	vec3 color = total.a > 0.0 ? total.rgb / total.a : vec3(0.0);
	color = pow(color / (1.0 + color * 0.25), vec3(1.0 / 2.2));
	gl_FragColor = vec4(color * total.a, total.a);
}`
