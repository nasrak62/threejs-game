import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import World from './world';
import gsap from 'gsap';

// ts-ignore
import vertexShaderPlayer from '../shaders/player/vertex.glsl';
import fragmentShaderPlayer from '../shaders/player/fragment.glsl';
import vertexShaderAura from '../shaders/aura/vertex.glsl';
import fragmentShaderAura from '../shaders/aura/fragment.glsl';
import Controller from './controller';
import MachineGun from './attacks/machine_gun';
import { loadTexture } from '../utils/textures';
import { loadGltf } from '../utils/gltf';

let instance: Player | null = null;

export default class Player {
    geometry?: THREE.SphereGeometry;
    shaderMaterial?: THREE.ShaderMaterial;
    material?: THREE.MeshStandardMaterial;
    mesh?: THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshStandardMaterial,
        THREE.Object3DEventMap
    >;
    scene?: THREE.Scene;
    gltf?: GLTF;
    mixer?: THREE.AnimationMixer;
    clips?: THREE.AnimationClip[];
    gltfLoader?: GLTFLoader;
    textureLoader?: THREE.TextureLoader;
    particles?: THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.PointsMaterial
    >;
    originalPositions?: Float32Array;
    controller?: Controller;
    height?: number;
    currentTexture?: THREE.Texture;
    particlesMaterial: any;
    camera: THREE.PerspectiveCamera | undefined;
    mousePosition?: THREE.Vector3;
    isAttack: any;
    mouseVector?: THREE.Vector2;
    machineGun?: MachineGun;
    rayCaster?: THREE.Raycaster;
    particlesBufferAttribute: THREE.BufferAttribute;
    particlesBufferAttributeReference: THREE.BufferAttribute;
    uShouldMoveToTarget: boolean;
    wasInited: boolean;

    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;

        const world = new World();
        this.camera = world.camera;
        this.scene = world.scene!;
        this.height = 2.01;
        this.controller = new Controller();
        this.gltfLoader = world.gltfLoader!;
        this.textureLoader = world.textureLoader!;
        this.isAttack = false;
        this.uShouldMoveToTarget = false;

        this.initSphere();
        this.initParticles();

        this.mouseVector = new THREE.Vector2();
        this.mousePosition = new THREE.Vector3();
        this.machineGun = new MachineGun();
        this.rayCaster = new THREE.Raycaster();
        this.wasInited = false;

        window.addEventListener(
            'mousedown',
            this.initParticleTarget.bind(this),
        );

        window.addEventListener(
            'mousemove',
            this.updateParticleTarget.bind(this),
        );

        window.addEventListener('mouseup', this.releaseMouse.bind(this));
    }

    static async init() {
        const player = new Player();

        if (player.wasInited) {
            return player;
        }

        await player.initAuraMesh();

        player.wasInited = true;

        return player;
    }

    releaseMouse(e: MouseEvent) {
        this.machineGun!.status = 'finish';
    }

    getUpdatedMousePoint(e: MouseEvent) {
        this.mouseVector!.set(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1,
        );

        this.rayCaster!.setFromCamera(this.mouseVector!, this.camera!);

        const intersects = this.rayCaster!.intersectObjects(
            this.scene!.children,
            true,
        );

        return intersects?.[0]?.point;
    }

    updateParticleTarget(e: MouseEvent) {
        if (!this.isAttack) {
            return;
        }

        const point = this.getUpdatedMousePoint(e);

        if (point) {
            this.mousePosition!.copy(point);
        }
    }

    initParticleTarget(e: MouseEvent) {
        const point = this.getUpdatedMousePoint(e);

        if (point) {
            this.mousePosition!.copy(point);
            this.isAttack = true;
            this.machineGun!.status = 'ready';
        }
    }

    initSphere() {
        this.geometry = new THREE.SphereGeometry(1, 100, 100);

        this.material = new THREE.MeshStandardMaterial({
            color: '#ff00ff',
        });

        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(1, 1.01, 1);

        this.scene!.add(this.mesh);
    }

    async initAuraMesh() {
        this.currentTexture = await loadTexture(
            this.textureLoader!,
            '/textures/bernard-hermant-qi-H70ga93s-unsplash.jpg',
        );

        this.shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShaderPlayer,
            fragmentShader: fragmentShaderPlayer,
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                uCameraPosition: { value: this.camera!.position },
                uTime: { value: 0 },
                canStart: { value: false },
                uNoiseTexture: { value: this.currentTexture },
                uResolution: {
                    value: {
                        x: window.innerWidth,
                        y: window.innerHeight,
                    },
                },
            },
        });

        const gltf = await loadGltf(this.gltfLoader!, '/models/test3.glb');

        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.material = this.shaderMaterial;
            }
        });

        this.gltf = gltf;
        this.mixer = new THREE.AnimationMixer(this.gltf!.scene!);
        this.clips = this.gltf!.animations;

        console.log({ clips: this.clips });

        const action = this.mixer.clipAction((gltf as any).animations[10]);

        this.scene!.add(gltf.scene);
        console.log({ action });
        action.reset();
        action.play();
    }

    setFirstParticlesPosition() {
        const particlesCount = this.geometry!.attributes.position.array.length;

        this.originalPositions = new Float32Array(particlesCount);

        const particlesGeometry = new THREE.BufferGeometry();

        this.particlesBufferAttribute =
            this.geometry!.attributes.position.clone();

        for (let index = 0; index < particlesCount; index += 1) {
            this.particlesBufferAttribute.setXYZ(
                index,
                this.particlesBufferAttribute.getX(index) * 1.5,
                this.particlesBufferAttribute.getY(index) * 1.5,
                this.particlesBufferAttribute.getZ(index) * 1.5,
            );
        }

        this.particlesBufferAttributeReference =
            this.particlesBufferAttribute.clone();

        particlesGeometry.setAttribute(
            'position',
            this.particlesBufferAttribute,
        );

        return particlesGeometry;
    }

    initParticles() {
        const particlesGeometry = this.setFirstParticlesPosition();

        this.particlesMaterial = new THREE.MeshStandardMaterial({
            transparent: true,
        });

        this.particlesMaterial.userData.uTime = { value: 0 };
        this.particlesMaterial.userData.uResolution = {
            value: {
                x: window.innerWidth,
                y: window.innerHeight,
            },
        };

        this.particlesMaterial.userData.uCameraPosition = {
            value: this.camera!.position,
        };

        this.particlesMaterial.userData.uShouldMoveToTarget = {
            value: this.uShouldMoveToTarget,
        };

        this.particlesMaterial.onBeforeCompile = (
            shader: THREE.WebGLProgramParametersWithUniforms,
        ) => {
            shader.uniforms.uTime = this.particlesMaterial.userData.uTime;

            shader.uniforms.uResolution =
                this.particlesMaterial.userData.uResolution;

            shader.uniforms.uCameraPosition =
                this.particlesMaterial.userData.uCameraPosition;

            shader.uniforms.uNoiseTexture = {
                value: this.currentTexture,
            };

            shader.uniforms.uHeight = {
                value: this.height,
            };

            shader.uniforms.uShouldMoveToTarget =
                this.particlesMaterial.userData.uShouldMoveToTarget;

            shader.vertexShader = vertexShaderAura;
            shader.fragmentShader = fragmentShaderAura;
        };

        this.particles = new THREE.Points(
            particlesGeometry,
            this.particlesMaterial,
        );

        this.particles.updateMatrixWorld();
        this.particles.updateMatrix();

        this.particles.position.set(1, 1, 1);
        this.scene!.add(this.particles);
    }

    updateMesh(deltaTime: number) {
        this.controller!.updateMesh(this.mesh!, deltaTime);
    }

    resetInnerParticlesPosition() {
        const particlesArray =
            this.particles!.geometry.attributes.position.array;

        const count = particlesArray.length;

        for (let index = 0; index < Math.floor(count / 3); index += 1) {
            this.particlesBufferAttribute.setXYZ(
                index,
                this.particlesBufferAttributeReference.getX(index),
                this.particlesBufferAttributeReference.getY(index),
                this.particlesBufferAttributeReference.getZ(index),
            );
        }
    }

    resetParticlesMeshPosition(deltaTime: number) {
        const distance = this.particles!.position.distanceToSquared(
            this.mesh!.position,
        );

        if (distance >= 0.1) {
            gsap.to(this.particles!.position, {
                x: this.mesh!.position.x,
                y: this.mesh!.position.y,
                z: this.mesh!.position.z,
                duration: 0.2,
                ease: 'power2',
            });
        }
    }

    defaultFlow(deltaTime: number) {
        if (this.isAttack) {
            this.resetInnerParticlesPosition();

            return;
        }

        this.resetParticlesMeshPosition(deltaTime);

        const particlesArray =
            this.particles!.geometry.attributes.position.array;

        const count = particlesArray.length;

        for (let index = 0; index < Math.floor(count / 3); index += 1) {
            const value = this.particlesBufferAttribute.getY(index);
            const shouldResetY = value >= 2;

            if (shouldResetY) {
                this.particlesBufferAttribute.setY(index, -2);
            } else {
                this.particlesBufferAttribute.setY(
                    index,
                    Math.random() * 0.1 + value,
                );
            }
        }
    }

    handleAttack(deltaTime: number) {
        this.isAttack = this.machineGun!.start(deltaTime);

        if (!this.isAttack) {
            this.resetInnerParticlesPosition();
        }
    }

    handleMovementFlow(deltaTime: number) {
        if (this.isAttack) {
            this.handleAttack(deltaTime);

            return;
        }

        this.defaultFlow(deltaTime);
    }

    async update(deltaTime: number, elapsedTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        this.handleMovementFlow(deltaTime);
        this.updateMesh(deltaTime);

        this.particlesMaterial.userData.uTime.value = elapsedTime;
        this.particlesMaterial.userData.uCameraPosition.value =
            this.camera!.position;
        this.particlesMaterial.userData.uShouldMoveToTarget.value =
            this.uShouldMoveToTarget;

        this.particles!.geometry.attributes.position.needsUpdate = true;

        if (this.shaderMaterial) {
            this.shaderMaterial.uniforms.uTime.value = elapsedTime;
            // this.shaderMaterial.uniforms.canStart.value = true;
        }
    }
}
