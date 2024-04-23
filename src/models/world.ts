import * as THREE from 'three';
// ts-ignore
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as RAPIER from '@dimforge/rapier3d';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import {
    loadResizedTexture,
    loadTexture,
    setGeometryUv2,
} from '../utils/textures';
import Player from './player';

let instance: World | null = null;

export default class World {
    sizes: { width: number; height: number };
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    // controls: PointerLockControls;
    clock: THREE.Clock;
    gltfLoader: GLTFLoader;
    textureLoader: THREE.TextureLoader;
    directionalLight?: THREE.DirectionalLight;
    ambientLight?: THREE.AmbientLight;
    floor?: THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.MeshStandardMaterial,
        THREE.Object3DEventMap
    >;
    player?: Player;
    directionalLightHelper?: THREE.DirectionalLightHelper;
    physicsWorld?: RAPIER.World;
    gravity: RAPIER.Vector3;
    groundColliderDesc?: RAPIER.ColliderDesc;
    groundRigidBodyDesc?: RAPIER.RigidBodyDesc;
    groundRigiDBody?: RAPIER.RigidBody;

    constructor() {
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();
        this.sizes = this.initSizes();
        this.camera = this.initCamera();
        this.renderer = this.initRenderer();
        // this.controls = this.initControls();
        this.gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);

        window.addEventListener('resize', this.handleResize.bind(this));
    }

    static async init() {
        if (instance) {
            return instance;
        }

        const world = new World();
        world.physicsWorld = new RAPIER.World(world.gravity);

        await world.initFloor();
        await world.initSky();
        await world.initPlayer(world);
        world.initLights();

        instance = world;

        return world;
    }

    async initSky() {
        const texture = await loadTexture(
            this.textureLoader,
            './textures/sky/skyTexture.jpg',
        );

        const sphereGeometry = new THREE.SphereGeometry(2000, 25, 25);

        const sky = new THREE.Mesh(
            sphereGeometry,
            new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.BackSide,
            }),
        );

        this.scene.add(sky);
    }

    async initPlayer(world: World) {
        try {
            this.player = await Player.init(world);
        } catch (error) {
            console.log(error);
        }
    }

    initLights() {
        this.ambientLight = new THREE.AmbientLight('#ffffff', 1);
        // this.ambientLight.castShadow = true;
        this.scene!.add(this.ambientLight);

        this.directionalLight = new THREE.DirectionalLight('#b9d5ff', 1);
        this.directionalLight.castShadow = true;
        this.directionalLight.position.set(4, 5, -2);

        if (this.player?.mesh) {
            this.directionalLight.lookAt(this.player!.mesh!.position!);
        }

        this.directionalLightHelper = new THREE.DirectionalLightHelper(
            this.directionalLight,
            2.0,
        );

        this.scene!.add(this.directionalLight);
        this.scene!.add(this.directionalLightHelper);
    }

    initRenderer() {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(this.sizes.width, this.sizes.height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(renderer.domElement);

        return renderer;
    }

    initControls() {
        // const controls = new PointerLockControls(
        //     this.camera!,
        //     this.renderer!.domElement,
        // );
        // this.scene.add(controls.getObject());
        // return controls;
    }

    initCamera() {
        const camera = new THREE.PerspectiveCamera(
            75,
            this.sizes.width / this.sizes.height,
            0.01,
            10000,
        );

        camera.position.z = -20;
        camera.position.y = 4;

        return camera;
    }

    async initFloor() {
        const grassColorTexture = await loadResizedTexture(
            this.textureLoader!,
            './textures/grass/color.jpg',
            8,
        );

        const grassNormalTexture = await loadResizedTexture(
            this.textureLoader!,
            './textures/grass/normal.jpg',
            8,
        );

        const grassRoughnessTexture = await loadResizedTexture(
            this.textureLoader!,
            './textures/grass/roughness.jpg',
            8,
        );

        const grassAmbientOcclusionTexture = await loadResizedTexture(
            this.textureLoader!,
            './textures/grass/ambientOcclusion.jpg',
            8,
        );

        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1024, 1024),
            new THREE.MeshStandardMaterial({
                map: grassColorTexture,
                normalMap: grassNormalTexture,
                roughnessMap: grassRoughnessTexture,
                aoMap: grassAmbientOcclusionTexture,
                side: THREE.DoubleSide,
            }),
        );

        this.groundRigidBodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
            0.0,
            -1.0,
            0.0,
        );

        this.groundRigiDBody = this.physicsWorld!.createRigidBody(
            this.groundRigidBodyDesc,
        );

        this.groundColliderDesc = RAPIER.ColliderDesc.cuboid(
            10000.0,
            0.1,
            10000.0,
        ).setFriction(1);

        this.physicsWorld!.createCollider(
            this.groundColliderDesc,
            this.groundRigiDBody,
        );

        setGeometryUv2(this.floor);
        this.floor.receiveShadow = true;
        this.floor.rotation.x = -Math.PI * 0.5;
        this.floor.position.y = 0;

        this.scene!.add(this.floor);

        // add 4 boxes

        const box1 = new THREE.BoxGeometry(10, 10, 10);
        const boxMaterial1 = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
        });

        const mesh1 = new THREE.Mesh(box1, boxMaterial1);
        mesh1.position.set(100, 0, 0);

        this.scene.add(mesh1);

        const boxMaterial2 = new THREE.MeshStandardMaterial({
            color: 0x0000ff,
        });

        const mesh2 = new THREE.Mesh(box1, boxMaterial2);
        mesh2.position.set(0, 100, 0);

        this.scene.add(mesh2);

        const boxMaterial3 = new THREE.MeshStandardMaterial({
            color: 0xff0000,
        });

        const mesh3 = new THREE.Mesh(box1, boxMaterial3);
        mesh3.position.set(0, 0, 100);

        this.scene.add(mesh3);

        const boxMaterial4 = new THREE.MeshStandardMaterial({
            color: 0xffff00,
        });

        const mesh4 = new THREE.Mesh(box1, boxMaterial4);
        mesh4.position.set(100, 100, 0);

        this.scene.add(mesh4);

        const boxMaterial5 = new THREE.MeshStandardMaterial({
            color: 0xff00ff,
        });

        const mesh5 = new THREE.Mesh(box1, boxMaterial5);
        mesh5.position.set(100, 0, 100);

        this.scene.add(mesh5);

        const boxMaterial6 = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
        });

        const mesh6 = new THREE.Mesh(box1, boxMaterial6);
        mesh6.position.set(0, 100, 100);

        this.scene.add(mesh6);

        const boxMaterial7 = new THREE.MeshStandardMaterial({
            color: 0xffffff,
        });

        const mesh7 = new THREE.Mesh(box1, boxMaterial7);
        mesh7.position.set(100, 100, 100);

        this.scene.add(mesh7);

        const boxMaterial8 = new THREE.MeshStandardMaterial({
            color: 0x000000,
        });

        const mesh8 = new THREE.Mesh(box1, boxMaterial8);
        mesh8.position.set(0, 0, 0);

        this.scene.add(mesh8);
    }

    initSizes() {
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };

        return sizes;
    }

    handleResize() {
        if (!this.sizes) {
            return;
        }

        this.sizes.width = window.innerWidth;
        this.sizes.height = window.innerHeight;
        this.camera.aspect = this.sizes.width / this.sizes.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.sizes.width, this.sizes.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }
}
