import * as THREE from 'three';

type TGenericMesh = THREE.Mesh<
    THREE.BufferGeometry,
    THREE.MeshStandardMaterial,
    THREE.Object3DEventMap
>;

export const getTexturePath = (prefix: string, currentName: string): string => {
    return prefix + currentName + '.jpg';
};

export const getGeometryUv2 = (geometry: THREE.BufferGeometry) => {
    return new THREE.Float32BufferAttribute(geometry.attributes.uv.array, 2);
};

export const setGeometryUv2 = (mesh: TGenericMesh) => {
    mesh.geometry.setAttribute('uv2', getGeometryUv2(mesh.geometry));
};

export const loadTexture = async (
    textureLoader: THREE.TextureLoader,
    path: string,
): Promise<THREE.Texture> => {
    return new Promise((resolve) => {
        try {
            textureLoader.load(path, (data) => {
                resolve(data);
            });
        } catch (error) {
            console.log(error);
        }
    });
};

export const loadResizedTexture = async (
    textureLoader: THREE.TextureLoader,
    path: string,
    size: number,
) => {
    try {
        const currentTexture = await loadTexture(textureLoader, path);

        currentTexture.repeat.set(size, size);
        currentTexture.wrapS = THREE.RepeatWrapping;
        currentTexture.wrapT = THREE.RepeatWrapping;

        return currentTexture;
    } catch (error) {
        console.log(error);
    }
};
