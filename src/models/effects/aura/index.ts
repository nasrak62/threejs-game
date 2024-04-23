import { loadGltf } from '../../../utils/gltf';
import Player from '../../player';
import vertexShaderPlayer from '../../../shaders/player/vertex.glsl';
import fragmentShaderPlayer from '../../../shaders/player/fragment.glsl';
import * as THREE from 'three';

let instance: Aura | null = null;

export default class Aura {
    player: Player;
    material: THREE.ShaderMaterial;
    geometry: THREE.SphereGeometry;
    mesh: THREE.Mesh<
        THREE.SphereGeometry,
        THREE.ShaderMaterial,
        THREE.Object3DEventMap
    >;

    constructor(player: Player) {
        this.player = player;
        this.material = this.initMaterial();
        this.geometry = this.initGeometry();
        this.mesh = this.initMesh();
    }

    static async init(player: Player) {
        if (instance) {
            return instance;
        }

        const aura = new Aura(player);

        instance = aura;

        return aura;
    }

    initGeometry() {
        // Ellipsoid parameters
        const xRadius = (this.player.height! * 2) / 3; // Radius along the x-axis
        const yRadius = this.player.height!; // Radius along the y-axis
        const zRadius = (this.player.height! * 2) / 3; // Radius along the z-axis
        const segments = 64; // Number of segments

        // Create ellipsoid geometry
        const auraGeometry = new THREE.SphereGeometry(
            yRadius,
            segments,
            segments,
        );

        auraGeometry.scale(xRadius / yRadius, 1, zRadius / yRadius);

        return auraGeometry;
    }

    initMaterial() {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 1.0 },
                noiseTexture: { value: this.player.currentTexture },
            },
            vertexShader: `
        uniform float time;
        uniform sampler2D noiseTexture;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
            vUv = uv;
            vec3 newPosition = position;
            float speed = time * 0.01;
            vec2 noiseUV = fract(vUv + vec2(speed * 0.1, 0.0)); // Use fract to ensure smooth wrapping
            float displacement = texture2D(noiseTexture, noiseUV).r * 0.5; // Adjust the scale (0.5) for the strength of displacement
            newPosition.y += displacement;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);


            vPosition = newPosition;
        }
    `,
            fragmentShader: `
        uniform float time;
        uniform sampler2D noiseTexture;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
            vec2 noiseUV = fract(vUv + vec2(time * 0.1, 0.0)); // Use fract to ensure smooth wrapping
            float noiseValue = texture2D(noiseTexture, noiseUV).r;
            vec3 fireColor = vec3(1.0, noiseValue * 0.5, 0.0); // Fire-like color
            float a = step(0.0, vPosition.y);
            gl_FragColor = vec4(fireColor, 0.3 * a);
        }
    `,
            transparent: true, // Make the aura material transparent
            depthTest: false, // Disable depth testing to render the aura in front of other objects
        });

        return material;
    }

    followPlayer() {
        this.mesh.position.copy(this.player.mesh!.position);
    }

    initMesh() {
        const mesh = new THREE.Mesh(this.geometry, this.material);
        this.player.mesh!.add(mesh!);
        mesh.position.copy(this.player.mesh!.position);
        // mesh.position.add(new THREE.Vector3(0, 20, 0));

        return mesh;
    }

    update() {
        this.material.uniforms.time.value += 0.01;
    }
}
