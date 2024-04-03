import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { loadResizedTexture, setGeometryUv2 } from '../utils/textures';
import Player from './player';

let instance: World | null = null;

export default class World {
    sizes?: { width: number; height: number };
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    ambientLight?: THREE.AmbientLight;
    renderer?: THREE.WebGLRenderer;
    controls?: OrbitControls;
    clock?: THREE.Clock;
    directionalLight?: THREE.DirectionalLight;
    textureLoader?: THREE.TextureLoader;
    floor?: THREE.Mesh<
        THREE.PlaneGeometry,
        THREE.MeshStandardMaterial,
        THREE.Object3DEventMap
    >;
    player?: Player;
    gltfLoader?: GLTFLoader;
    wasInit: any;

    constructor() {
        if (instance) {
            return instance;
        }

        instance = this;

        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.textureLoader = new THREE.TextureLoader();
        this.gltfLoader = new GLTFLoader();

        this.initSizes();
        this.initCamera();
        this.initRenderer();
        this.initControls();

        window.addEventListener('resize', this.handleResize.bind(this));
        this.wasInit = false;
    }

    static async init() {
        const world = new World();

        if (world.wasInit) {
            return world;
        }

        await world.initFloor();
        await world.initPlayer();
        world.initLights();
        world.wasInit = true;

        return world;
    }

    async initPlayer() {
        this.player = await Player.init();
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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.sizes!.width, this.sizes!.height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        document.body.appendChild(this.renderer.domElement);
    }

    initControls() {
        this.controls = new OrbitControls(
            this.camera,
            this.renderer!.domElement,
        );
    }

    initCamera() {
        // this.camera = new THREE.PerspectiveCamera(
        //     45,
        //     this.sizes!.width / this.sizes!.height,
        //     0.1,
        //     1000,
        // );
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.sizes!.width / this.sizes!.height,
            0.01,
            10000,
        );

        this.camera.position.z = 10;
        this.camera.position.y = 4;
    }

    async initFloor() {
        const grassColorTexture = await loadResizedTexture(
            this.textureLoader!,
            '/textures/grass/color.jpg',
            8,
        );

        const grassNormalTexture = await loadResizedTexture(
            this.textureLoader!,
            '/textures/grass/normal.jpg',
            8,
        );

        const grassRoughnessTexture = await loadResizedTexture(
            this.textureLoader!,
            '/textures/grass/roughness.jpg',
            8,
        );

        const grassAmbientOcclusionTexture = await loadResizedTexture(
            this.textureLoader!,
            '/textures/grass/ambientOcclusion.jpg',
            8,
        );

        this.floor = new THREE.Mesh(
            new THREE.PlaneGeometry(1024, 1024),
            new THREE.MeshStandardMaterial({
                map: grassColorTexture,
                normalMap: grassNormalTexture,
                roughnessMap: grassRoughnessTexture,
                aoMap: grassAmbientOcclusionTexture,
            }),
        );

        setGeometryUv2(this.floor);
        this.floor.receiveShadow = true;
        this.floor.rotation.x = -Math.PI * 0.5;
        this.floor.position.y = 0;

        this.scene!.add(this.floor);
    }

    initSizes() {
        this.sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
        };
    }

    handleResize() {
        if (!this.sizes) {
            return;
        }

        this.sizes!.width = window.innerWidth;
        this.sizes!.height = window.innerHeight;
        this.camera!.aspect = this.sizes!.width / this.sizes!.height;
        this.camera!.updateProjectionMatrix();
        this.renderer!.setSize(this.sizes!.width, this.sizes!.height);
        this.renderer!.setPixelRatio(window.devicePixelRatio);
    }
}
