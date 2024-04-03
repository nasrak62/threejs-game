import * as THREE from 'three';
import Player from '../../player';
import gsap from 'gsap';

export default class MachineGun {
    particles?: THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.PointsMaterial
    >;
    originalPositions?: Float32Array;
    mousePosition?: THREE.Vector3;
    status: string;
    mesh:
        | THREE.Mesh<
              THREE.SphereGeometry,
              THREE.MeshStandardMaterial,
              THREE.Object3DEventMap
          >
        | undefined;
    particlesBufferAttribute: THREE.BufferAttribute;
    particlesBufferAttributeReference: THREE.BufferAttribute;
    resetInnerParticlesPosition: () => void;
    camera: THREE.PerspectiveCamera | undefined;
    uShouldMoveToTarget: boolean;
    particlesMaterial: any;
    scene: THREE.Scene | undefined;
    tweens: gsap.core.Tween[];
    meshes: any;

    constructor() {
        const player = new Player();

        this.particles = player.particles;
        this.mesh = player.mesh;
        this.camera = player.camera;
        this.originalPositions = player.originalPositions;
        this.mousePosition = player.mousePosition;
        this.particlesBufferAttribute = player.particlesBufferAttribute!;
        this.particlesBufferAttributeReference =
            player.particlesBufferAttributeReference!;

        this.uShouldMoveToTarget = player.uShouldMoveToTarget!;
        this.particlesMaterial = player.particlesMaterial;
        this.scene = player.scene;

        this.status = 'ready';

        (window as any).particles = this.particles;
        (window as any).particlesBufferAttribute =
            this.particlesBufferAttribute;
        (window as any).particlesBufferAttributeReference =
            this.particlesBufferAttributeReference;

        this.resetInnerParticlesPosition = player.resetInnerParticlesPosition;
        this.tweens = [];
        this.meshes = {};
    }

    moveParticlesIntoPosition() {
        const newPosition = new THREE.Vector3().copy(this.mesh!.position);

        const direction = new THREE.Vector3()
            .subVectors(this.mousePosition!, newPosition)
            .normalize();

        direction.y += 2;
        newPosition.addScaledVector(direction, 4);
        this.resetInnerParticlesPosition();

        gsap.to(this.particles!.position, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z,
            duration: 0.2,
            ease: 'power2',
            onComplete: () => {
                this.status = 'inPlace';
            },
        });
    }

    fireParticlesToTarget() {
        const material = this.particlesMaterial;
        const geometry = new THREE.SphereGeometry(0.1);
        const count = this.particles!.geometry.attributes.position.count;
        const step = Math.floor(count / 10);

        for (
            let index = 0;
            index < this.particles!.geometry.attributes.position.count;
            index += step
        ) {
            const vector = new THREE.Vector3();
            vector.fromBufferAttribute(
                this.particles!.geometry.attributes.position,
                index,
            );

            this.particles!.localToWorld(vector);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(vector);
            mesh.name = 'attackMesh';

            this.meshes[mesh.uuid] = mesh;

            this.scene!.add(mesh);

            const tween = gsap.to(mesh.position, {
                x: this.mousePosition!.x,
                y: this.mousePosition!.y,
                z: this.mousePosition!.z,
                duration: 0.4,
                delay: Math.random(),
                ease: 'power2',
                onComplete: () => {
                    delete this.meshes[mesh.uuid];
                    this.scene?.remove(mesh);
                    mesh.clear();
                },
            });

            this.tweens.push(tween);
        }
    }

    handleFinish() {
        const player = new Player();

        if (this.tweens.length) {
            this.tweens.forEach((tween) => {
                tween.kill();
            });
        }

        const keys = Object.keys(this.meshes);

        for (const key of keys) {
            const mesh = this.meshes[key];

            this.scene!.remove(mesh);
            mesh.clear();
        }

        player.isAttack = false;
    }

    start() {
        if (this.status === 'ready') {
            this.moveParticlesIntoPosition();
            return true;
        }

        if (this.status === 'inPlace') {
            this.fireParticlesToTarget();

            return true;
        }

        if (this.status === 'finish') {
            this.handleFinish();
        }

        return false;
    }
}
