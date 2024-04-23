import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const loadGltf = async (
    gltfLoader: GLTFLoader,
    path: string,
): Promise<GLTF> => {
    return new Promise((resolve) => {
        try {
            gltfLoader.load(path, (gltf) => {
                resolve(gltf);
            });
        } catch (error) {
            console.log({ error });

            resolve(null as any);
        }
    });
};
