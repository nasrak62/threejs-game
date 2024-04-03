varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform bool canStart;
uniform sampler2D uNoiseTexture;
uniform vec2 uResolution;
uniform bool uShouldMoveToTarget;

const float pi = 3.14285714286;


void main(){



    vec3 newPosition = position;
  

    

    vec4 modelPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_PointSize = 0.5 * ( 50.0 / length( modelPosition.xyz ) );
    gl_Position = projectionMatrix * modelPosition;
    vNormal = normal;
    vUv = uv;
    vPosition = position;
}