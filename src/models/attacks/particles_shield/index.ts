import * as THREE from 'three';
import Player from '../../player';
import gsap from 'gsap';
import vertexShaderAura from '../../../shaders/aura/vertex.glsl';
import fragmentShaderAura from '../../../shaders/aura/fragment.glsl';

let instance: ParticlesShield | null = null;

export default class ParticlesShield {
    player: Player;
    originalPositions?: Float32Array;
    particlesBufferAttribute: THREE.BufferAttribute;
    particlesBufferAttributeReference: THREE.BufferAttribute;
    geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes>;
    material: THREE.MeshStandardMaterial;
    mesh: THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.MeshStandardMaterial
    >;

    constructor(player: Player) {
        this.player = player;
        this.originalPositions = new Float32Array(this.getParticlesCount());
        this.particlesBufferAttribute = this.getGeometryPosition();
        this.particlesBufferAttributeReference = this.getGeometryPosition();
        this.geometry = this.initGeometry();
        this.material = this.initMaterial();
        this.mesh = this.initMesh();
    }

    static async init(player: Player) {
        if (instance) {
            return instance;
        }

        const particlesShield = new ParticlesShield(player);

        instance = particlesShield;

        return instance;
    }

    getParticlesCount() {
        return this.player.meshSphere!.geometry!.attributes.position.array
            .length;
    }

    getGeometryPosition() {
        return this.player.meshSphere!.geometry!.attributes.position.clone();
    }

    initGeometry() {
        const particlesGeometry = new THREE.BufferGeometry();

        for (let index = 0; index < this.getParticlesCount(); index += 1) {
            this.particlesBufferAttribute.setXYZ(
                index,
                this.particlesBufferAttribute.getX(index),
                this.particlesBufferAttribute.getY(index),
                this.particlesBufferAttribute.getZ(index),
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

    initMaterial() {
        const material = new THREE.MeshStandardMaterial({
            transparent: true,
        });

        material.userData.uTime = { value: 0 };
        material.userData.uResolution = {
            value: {
                x: window.innerWidth,
                y: window.innerHeight,
            },
        };

        material.userData.uCameraPosition = {
            value: this.player.camera!.position,
        };

        material.userData.uShouldMoveToTarget = {
            value: this.player.uShouldMoveToTarget,
        };

        material.onBeforeCompile = (
            shader: THREE.WebGLProgramParametersWithUniforms,
        ) => {
            shader.uniforms.uTime = material.userData.uTime;

            shader.uniforms.uResolution = material.userData.uResolution;

            shader.uniforms.uCameraPosition = material.userData.uCameraPosition;

            shader.uniforms.uNoiseTexture = {
                value: this.player.currentTexture,
            };

            shader.uniforms.uHeight = {
                value: this.player.height! * 2,
            };

            shader.uniforms.uShouldMoveToTarget =
                material.userData.uShouldMoveToTarget;

            shader.vertexShader = vertexShaderAura;
            shader.fragmentShader = fragmentShaderAura;
        };

        return material;
    }

    initMesh() {
        const mesh = new THREE.Points(this.geometry, this.material);

        mesh.updateMatrixWorld();
        mesh.updateMatrix();

        mesh.position.set(1, 1, 1);
        this.player.scene!.add(mesh);

        

        return mesh;
    }

    resetGeometryPosition() {
        const particlesArray = this.mesh!.geometry.attributes.position.array;

        const count = particlesArray.length;

        for (let index = 0; index < Math.floor(count / 3); index += 1) {
            this.particlesBufferAttribute!.setXYZ(
                index,
                this.particlesBufferAttributeReference!.getX(index),
                this.particlesBufferAttributeReference!.getY(index),
                this.particlesBufferAttributeReference!.getZ(index),
            );
        }
    }

    resetMeshPosition() {
        const distance = this.mesh!.position.distanceToSquared(
            this.player.meshSphere!.position,
        );

        if (distance >= 0.1) {
            gsap.to(this.mesh!.position, {
                x: this.player.meshSphere!.position.x,
                y: this.player.meshSphere!.position.y,
                z: this.player.meshSphere!.position.z,
                duration: 0.2,
                ease: 'power2',
            });
        }
    }

    defaultFlow() {
        if (this.player.isAttack) {
            this.resetGeometryPosition();

            return;
        }

        this.resetMeshPosition();

        const particlesArray = this.mesh.geometry.attributes.position.array;
        const count = particlesArray.length;

        for (let index = 0; index < Math.floor(count / 3); index += 1) {
            const value = this.particlesBufferAttribute!.getY(index);
            const shouldResetY = value >= this.player.height! * 2;

            if (shouldResetY) {
                this.particlesBufferAttribute!.setY(
                    index,
                    -1 * this.player.height! * 2,
                );
            } else {
                this.particlesBufferAttribute!.setY(
                    index,
                    Math.random() * 0.2 + value,
                );
            }
        }
    }

    update(elapsedTime: number) {
        this.material.userData.uTime.value = elapsedTime;
        this.material.userData.uCameraPosition.value =
            this.player.camera!.position;

        this.material.userData.uShouldMoveToTarget.value =
            this.player.uShouldMoveToTarget;

        this.mesh!.geometry.attributes.position.needsUpdate = true;
    }
}
