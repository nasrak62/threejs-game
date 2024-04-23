import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/addons/loaders/GLTFLoader.js';
import World from './world';
import gsap from 'gsap';

import Controller from './controller';
import MachineGun from './attacks/machine_gun';
import { loadTexture } from '../utils/textures';
import MouseHandler from './mouse_handler';
import ParticlesShield from './attacks/particles_shield';
import Aura from './effects/aura';
import { loadGltf } from '../utils/gltf';
import ThirdPersonCamera from './third_person_camera';
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as RAPIER from '@dimforge/rapier3d';

let instance: Player | null = null;

export default class Player {
    geometry?: THREE.SphereGeometry;
    material?: THREE.MeshStandardMaterial;
    mesh?: THREE.Group<THREE.Object3DEventMap>;
    scene: THREE.Scene;
    gltf?: GLTF;
    mixer?: THREE.AnimationMixer;
    clips?: THREE.AnimationClip[];
    gltfLoader: GLTFLoader;
    textureLoader: THREE.TextureLoader;
    controller?: Controller;
    height?: number;
    currentTexture?: THREE.Texture;
    camera: THREE.PerspectiveCamera | undefined;
    isAttack: any;
    machineGun?: MachineGun;
    uShouldMoveToTarget?: boolean;
    mouseHandler?: MouseHandler;
    particlesShield?: ParticlesShield;
    aura?: Aura;
    meshSphere?: THREE.Mesh<
        THREE.SphereGeometry,
        THREE.MeshBasicMaterial,
        THREE.Object3DEventMap
    >;
    thirdPersonCamera?: ThirdPersonCamera;
    // controls: PointerLockControls;
    renderer: THREE.WebGLRenderer;
    physicsWorld: RAPIER.World;
    rigidBodyDesc?: RAPIER.RigidBodyDesc;
    rigidBody?: RAPIER.RigidBody;
    colliderDesc?: RAPIER.ColliderDesc;
    collider?: RAPIER.Collider;

    constructor(world: World) {
        this.camera = world.camera;
        this.scene = world.scene;
        // this.controls = world.controls;
        this.renderer = world.renderer;
        this.height = 2;
        this.gltfLoader = world.gltfLoader;
        this.textureLoader = world.textureLoader;
        this.physicsWorld = world.physicsWorld!;
        this.isAttack = false;
        this.uShouldMoveToTarget = false;
    }

    static async init(world: World) {
        if (instance) {
            return instance;
        }

        const player = new Player(world);

        await player.initTexture();
        player.initPhysics();
        await player.initMesh();
        player.calculateMeshSphere();

        player.camera?.lookAt(player.mesh!.position);
        // player.aura = await Aura.init(player);
        // player.particlesShield = await ParticlesShield.init(player);
        player.thirdPersonCamera = new ThirdPersonCamera(player);
        player.mouseHandler = await MouseHandler.init(player);
        player.controller = await Controller.init(player);
        // player.machineGun = await MachineGun.init(player);

        instance = player;

        return player;
    }

    initPhysics() {
        // Create a dynamic rigid-body.
        this.rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(0.0, 1.0, 0.0)
            .enabledRotations(false, true, false)
            .setCanSleep(false);

        this.rigidBody = this.physicsWorld.createRigidBody(this.rigidBodyDesc);

        window.rigidBody = this.rigidBody;
        window.camera = this.camera;

        this.colliderDesc = RAPIER.ColliderDesc.capsule(1.0, 2.0)
            .setMass(60)
            .setFriction(1)
            .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);

        this.collider = this.physicsWorld.createCollider(
            this.colliderDesc,
            this.rigidBody,
        );
    }

    async initTexture() {
        try {
            this.currentTexture = await loadTexture(
                this.textureLoader!,
                './textures/bernard-hermant-qi-H70ga93s-unsplash.jpg',
            );
        } catch (error) {
            console.log({ error });
        }
    }

    handleMouseUp() {
        if (this.machineGun) {
            this.machineGun!.status = 'finish';
        }
    }

    handleMouseMove(e: MouseEvent) {
        this.updateParticleTarget(e);
    }

    handleMouseDown(e: MouseEvent) {
        this.initParticleTarget(e);
    }

    updateParticleTarget(e: MouseEvent) {
        if (!this.isAttack) {
            return;
        }
    }

    initParticleTarget(e: MouseEvent) {
        if (this.mouseHandler!.lastContactPoint && this.machineGun) {
            this.isAttack = true;
            this.machineGun.status = 'ready';
        }
    }

    calculateMeshSphere() {
        const sphere = new THREE.Sphere();

        if (!this.mesh) {
            return;
        }

        // Loop through all children of the group
        this.mesh?.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                // Compute the bounding sphere of each mesh
                const childGeometry = child.geometry;
                // childGeometry.
                childGeometry.computeBoundingSphere();
                // Expand the overall bounding sphere to include the child's bounding sphere
                if (childGeometry.boundingSphere !== null) {
                    sphere.union(
                        childGeometry.boundingSphere
                            .clone()
                            .applyMatrix4(child.matrixWorld),
                    );
                }
            }
        });

        const radius = this.height!;
        const geometry = new THREE.SphereGeometry(radius, 256, 256);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        const position = this.mesh!.position.clone();
        position.add(new THREE.Vector3(0, radius * 1.1, 0));

        mesh.position.copy(position);
        this.meshSphere = mesh;
    }

    async initMesh() {
        try {
            const gltf = await loadGltf(this.gltfLoader, './models/Xbot.glb');

            this.mesh = gltf.scene;
            window.mesh = this.mesh;

            const identityQuaternion = new THREE.Quaternion();
            gltf.scene.scale.set(2, 2, 2);
            gltf.scene.setRotationFromQuaternion(identityQuaternion);

            gltf.scene.traverse((children) => {
                if (children instanceof THREE.Mesh) {
                    children.setRotationFromQuaternion(identityQuaternion);
                    // children.rotation.y = Math.PI;
                }
            });

            const axesHelper = new THREE.AxesHelper(5000);
            this.scene.add(axesHelper);

            const axesHelper2 = new THREE.AxesHelper(5000);
            axesHelper2.setColors(
                new THREE.Color('#004953'),
                new THREE.Color('#00ffbb'),
                new THREE.Color('#00fcff'),
            );
            axesHelper2.rotation.y = Math.PI;
            axesHelper2.rotation.x = Math.PI;
            this.scene.add(axesHelper2);

            this.scene!.add(gltf.scene);
        } catch (error) {
            console.log(error);
        }
    }

    updateMesh(deltaTime: number) {
        if (!this.mesh || !this.rigidBody) {
            return;
        }

        this.controller?.updateMesh(this.mesh, deltaTime);
        const translation = this.rigidBody.translation();
        const translationVector = new THREE.Vector3(
            translation.x,
            translation.y,
            translation.z,
        );

        const rotation = this.rigidBody.rotation();
        const rotationVector = new THREE.Quaternion(
            rotation.x,
            rotation.y,
            rotation.z,
        );

        const target = new THREE.Object3D();
        this.mesh.position.copy(translationVector);
        this.mesh.quaternion.copy(rotationVector);

        window.targetVector = new THREE.Vector3();
        this.mesh.getWorldDirection(window.targetVector);

        target.position.copy(this.mesh.position);
        target.quaternion.copy(this.mesh.quaternion);

        // this.camera?.position.copy(translationVector);
        // this.camera?.position.add(new THREE.Vector3(0, 4, -10));
        // this.camera?.lookAt(target.position);
        this.aura?.followPlayer();

        gsap.to(this.meshSphere!.position, {
            x: this.mesh.position.x,
            y: this.mesh.position.y,
            z: this.mesh.position.z,
            duration: 0.2,
            ease: 'power2',
        });

        // this.meshSphere?.position.copy(this.mesh.position);
    }

    handleAttack() {
        this.isAttack = this.machineGun!.start();

        if (!this.isAttack) {
            this.particlesShield?.resetGeometryPosition();
        }
    }

    handleMovementFlow() {
        if (this.isAttack) {
            this.handleAttack();

            return;
        }

        this.particlesShield?.defaultFlow();
    }

    async update(deltaTime: number, elapsedTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        this.handleMovementFlow();
        this.updateMesh(deltaTime);

        this.particlesShield?.update(elapsedTime);
        this.aura?.update();
        // this.thirdPersonCamera?.update(elapsedTime);

        // update camera
        // if (this.mesh && this.camera) {
        //     const relativeCameraOffset = new THREE.Vector3(0, 3, 4);

        //     const cameraOffset = relativeCameraOffset.applyMatrix4(
        //         this.mesh.matrixWorld,
        //     );

        //     this.camera.position.copy(cameraOffset);
        // }
    }
}
