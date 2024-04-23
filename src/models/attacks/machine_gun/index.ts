import * as THREE from 'three';
import Player from '../../player';
import gsap from 'gsap';

let instance: MachineGun | null = null;

export default class MachineGun {
    originalPositions?: Float32Array;
    mousePosition?: THREE.Vector3;
    status?: string;
    mesh: THREE.Group<THREE.Object3DEventMap>;
    particlesBufferAttribute?: THREE.BufferAttribute;
    particlesBufferAttributeReference?: THREE.BufferAttribute;
    resetInnerParticlesPosition?: () => void;
    camera: THREE.PerspectiveCamera | undefined;
    uShouldMoveToTarget?: boolean;
    particlesMaterial: any;
    scene?: THREE.Scene;
    tweens?: gsap.core.Tween[];
    meshes: any;
    player: Player;
    particles: THREE.Points<
        THREE.BufferGeometry<THREE.NormalBufferAttributes>,
        THREE.MeshStandardMaterial
    >;

    constructor(player: Player) {
        this.player = player;
        this.particles = player.particlesShield!.mesh!;
        this.mesh = player.mesh!;
        this.camera = player.camera;
        this.originalPositions = player.particlesShield!.originalPositions;
        this.mousePosition = player.mouseHandler!.mousePosition;

        this.particlesBufferAttribute =
            player.particlesShield!.particlesBufferAttribute;

        this.particlesBufferAttributeReference =
            player.particlesShield!.particlesBufferAttributeReference;

        this.uShouldMoveToTarget = player.uShouldMoveToTarget!;
        this.particlesMaterial = player.particlesShield!.material;
        this.scene = player.scene;

        this.status = 'ready';

        (window as any).particles = this.particles;
        (window as any).particlesBufferAttribute =
            this.particlesBufferAttribute;
        (window as any).particlesBufferAttributeReference =
            this.particlesBufferAttributeReference;

        this.tweens = [];
        this.meshes = {};
    }

    static async init(player: Player) {
        if (instance) {
            return instance;
        }

        const machine_gun = new MachineGun(player);

        instance = machine_gun;

        return machine_gun;
    }

    moveParticlesIntoPosition() {
        const newPosition = new THREE.Vector3().copy(this.mesh!.position);

        const direction = new THREE.Vector3()
            .subVectors(this.mousePosition!, newPosition)
            .normalize();

        direction.y += this.player.height!;
        newPosition.addScaledVector(direction, 4);
        this.player.particlesShield?.resetGeometryPosition();

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

            this.tweens!.push(tween);
        }
    }

    handleFinish() {
        if (this.tweens!.length) {
            this.tweens!.forEach((tween) => {
                tween.kill();
            });
        }

        const keys = Object.keys(this.meshes);

        for (const key of keys) {
            const mesh = this.meshes[key];

            this.scene!.remove(mesh);
            mesh.clear();
        }

        this.player!.isAttack = false;
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
