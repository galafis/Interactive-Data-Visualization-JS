// Vertex Shader básico para WebGL
// Compatível com Interactive Data Visualization JS

attribute vec3 aPosition;
attribute vec3 aColor;
attribute float aSize;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform float uPointScale;

varying vec3 vColor;
varying float vSize;

void main() {
  // Transformar posição do vértice
  vec4 worldPosition = uModelMatrix * vec4(aPosition, 1.0);
  vec4 viewPosition = uViewMatrix * worldPosition;
  gl_Position = uProjectionMatrix * viewPosition;
  
  // Calcular tamanho do ponto baseado na distância
  float distance = length(viewPosition.xyz);
  gl_PointSize = (aSize * uPointScale) / (1.0 + distance * 0.1);
  
  // Repassar cor e tamanho para fragment shader
  vColor = aColor;
  vSize = gl_PointSize;
}
