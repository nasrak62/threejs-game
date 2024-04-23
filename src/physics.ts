import * as RAPIER from '@dimforge/rapier3d';

export const initPhysics = async () => {
    return new Promise(async (resolve): Promise<any> => {
        const currentRapier = await import('@dimforge/rapier3d');

        resolve(currentRapier);
    });
};
