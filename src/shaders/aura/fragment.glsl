varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

uniform float uTime;
uniform float uHeight;
uniform bool canStart;
uniform sampler2D uNoiseTexture;
uniform vec2 uResolution;
uniform vec3 uCameraPosition;



vec3 getFresnel(){
    float fresnel = dot(normalize(vec3(1.0,1.0,0.0) - vPosition), normalize(vNormal));
    float str = 1.0 - fresnel;
    vec3 color = vec3(1.0, 0.6, 1.0);
    vec3 outerColor = color * str;
    vec3 innerColor = color * fresnel;
    vec3 mixColor = mix(vec3(1.0,1.0,0.0), vec3(0.0,1.0,1.0), 0.2);

    return mixColor;
}




void main(){
    float a = 1.0 - step(0.8 , vPosition.y / uHeight);

    gl_FragColor = vec4(1.0, 1.0, 0.0, a);
}