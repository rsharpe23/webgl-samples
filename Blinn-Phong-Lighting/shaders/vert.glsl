attribute vec3 a_Position;
attribute vec3 a_Normal;
attribute vec2 a_Texcoord;

uniform mat4 u_PMatrix; 
uniform mat4 u_MVMatrix;
uniform mat4 u_NMatrix;

uniform vec3 u_AmbientColor;
uniform vec3 u_DiffuseColor;
uniform vec3 u_SpecularColor;
uniform vec3 u_LightingPos;

uniform vec3 u_MaterialAmbientColor;
uniform vec3 u_MaterialSpecularColor;

varying vec3 v_Color;
varying vec2 v_Texcoord;

void main(void) {
  float specular = 0.0;

  vec4 vertexPos4 =  u_MVMatrix * vec4(a_Position, 1.0);
  vec3 vertexPos = vertexPos4.xyz;
  vec3 eye = normalize(-vertexPos);

  vec3 transformedNormal = vec3(u_NMatrix * vec4(a_Normal, 1.0));
  vec3 normal = normalize(transformedNormal);

  vec3 lightDir = normalize(u_LightingPos);
  float lambertTerm = max(dot(normal, -lightDir), 0.0);

  if (lambertTerm > 0.0) {
    vec3 halfDir = normalize(-lightDir + eye);
    float specAngle = max(dot(halfDir, normal), 0.0);
    specular = pow(specAngle, 16.0);
  }

  v_Color = u_AmbientColor * u_MaterialAmbientColor 
    + u_DiffuseColor * lambertTerm 
    + u_SpecularColor * u_MaterialSpecularColor * specular;

  v_Texcoord = a_Texcoord;
  gl_Position = u_PMatrix * vertexPos4;
}