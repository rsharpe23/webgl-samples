const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const { width, height } = canvas;
const { mat4, mat3 } = glMatrix;

const prog = createProgram(gl);

function render(gltf) {
  // Инициализация

  const pMatrix = createMatrix(mat4);
  const vMatrix = createMatrix(mat4);
  const mMatrix = createMatrix(mat4);
  const nMatrix = createMatrix(mat3);

  const u_PMatrix = gl.getUniformLocation(prog, 'u_PMatrix');
  const u_VMatrix = gl.getUniformLocation(prog, 'u_VMatrix');
  const u_MMatrix = gl.getUniformLocation(prog, 'u_MMatrix');
  const u_NMatrix = gl.getUniformLocation(prog, 'u_NMatrix');

  const u_AmbientLightColor = gl.getUniformLocation(prog, 'u_AmbientLightColor');
  const u_DiffuseLightColor = gl.getUniformLocation(prog, 'u_DiffuseLightColor');
  const u_SpecularLightColor = gl.getUniformLocation(prog, 'u_SpecularLightColor');
  const u_LightPos = gl.getUniformLocation(prog, 'u_LightPos');

  const u_AmbientMaterialColor = gl.getUniformLocation(prog, 'u_AmbientMaterialColor');
  const u_DiffuseMaterialColor = gl.getUniformLocation(prog, 'u_DiffuseMaterialColor');
  const u_SpecularMaterialColor = gl.getUniformLocation(prog, 'u_SpecularMaterialColor');

  const attrs = {
    POSITION: gl.getAttribLocation(prog, 'a_Pos'),
    NORMAL: gl.getAttribLocation(prog, 'a_Normal'),
  };

  console.log(JSON.stringify(gltf.getScene()));

  // const a_Pos = gl.getAttribLocation(prog, 'a_Pos');
  // const a_Normal = gl.getAttribLocation(prog, 'a_Normal');

  // const vbo = createBuffer(gl.ARRAY_BUFFER,
  //   new Float32Array([
  //     //лицевая часть
  //     -0.5, -0.5, 0.5,
  //     -0.5, 0.5, 0.5,
  //     0.5, 0.5, 0.5,
  //     0.5, -0.5, 0.5,
  //     // задняя часть
  //     -0.5, -0.5, -0.5,
  //     -0.5, 0.5, -0.5,
  //     0.5, 0.5, -0.5,
  //     0.5, -0.5, -0.5,
  //     // левая часть
  //     -0.5, -0.5, 0.5,
  //     -0.5, 0.5, 0.5,
  //     -0.5, 0.5, -0.5,
  //     -0.5, -0.5, -0.5,
  //     // правая часть
  //     0.5, -0.5, 0.5,
  //     0.5, 0.5, 0.5,
  //     0.5, 0.5, -0.5,
  //     0.5, -0.5, -0.5,
  //     // верхняя часть
  //     -0.5, 0.5, 0.5,
  //     -0.5, 0.5, -0.5,
  //     0.5, 0.5, -0.5,
  //     0.5, 0.5, 0.5,
  //     // нижняя часть
  //     -0.5, -0.5, 0.5,
  //     -0.5, -0.5, -0.5,
  //     0.5, -0.5, -0.5,
  //     0.5, -0.5, 0.5,
  //   ])
  // );

  // const nbo = createBuffer(gl.ARRAY_BUFFER,
  //   new Float32Array([
  //     0.0, 0.0, 1.0,
  //     0.0, 0.0, 1.0,
  //     0.0, 0.0, 1.0,
  //     0.0, 0.0, 1.0,

  //     0.0, 0.0, -1.0,
  //     0.0, 0.0, -1.0,
  //     0.0, 0.0, -1.0,
  //     0.0, 0.0, -1.0,

  //     -1.0, 0.0, 0.0,
  //     -1.0, 0.0, 0.0,
  //     -1.0, 0.0, 0.0,
  //     -1.0, 0.0, 0.0,

  //     1.0, 0.0, 0.0,
  //     1.0, 0.0, 0.0,
  //     1.0, 0.0, 0.0,
  //     1.0, 0.0, 0.0,

  //     0.0, 1.0, 0.0,
  //     0.0, 1.0, 0.0,
  //     0.0, 1.0, 0.0,
  //     0.0, 1.0, 0.0,

  //     0.0, -1.0, 0.0,
  //     0.0, -1.0, 0.0,
  //     0.0, -1.0, 0.0,
  //     0.0, -1.0, 0.0,
  //   ])
  // );

  // const ibo = createBuffer(gl.ELEMENT_ARRAY_BUFFER,
  //   new Uint16Array([
  //     0, 1, 2,
  //     2, 3, 0,

  //     4, 5, 6,
  //     6, 7, 4,

  //     8, 9, 10,
  //     10, 11, 8,

  //     12, 13, 14,
  //     14, 15, 12,

  //     16, 17, 18,
  //     18, 19, 16,

  //     20, 21, 22,
  //     22, 23, 20,
  //   ])
  // );

  gl.clearColor(0.0, 0.0, 0.14, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(prog);

  // Отрисовка

  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 1.04, width / height, 0.1, 100.0);
  gl.uniformMatrix4fv(u_PMatrix, false, pMatrix);

  mat4.lookAt(vMatrix, [0.0, 0.0, 2.0], [0.0, 0.0, 0.0], [0, 1, 0]);
  gl.uniformMatrix4fv(u_VMatrix, false, vMatrix);

  gl.uniform3fv(u_AmbientLightColor, [0.3, 0.3, 0.3]);
  gl.uniform3fv(u_DiffuseLightColor, [0.7, 0.7, 0.7]);
  gl.uniform3fv(u_SpecularLightColor, [1.0, 1.0, 1.0]);
  gl.uniform3fv(u_LightPos, [0.0, 8.0, 6.0]);

  gl.uniform3fv(u_AmbientMaterialColor, [0.6, 0.9, 0.3]);
  gl.uniform3fv(u_DiffuseMaterialColor, [0.7, 0.7, 0.7]);
  gl.uniform3fv(u_SpecularMaterialColor, [1.0, 1.0, 1.0]);

  mat4.translate(mMatrix, mMatrix, [0.0, 0.0, -3.0]);
  mat4.rotate(mMatrix, mMatrix, Math.PI / 4, [1, 1, 0]);
  gl.uniformMatrix4fv(u_MMatrix, false, mMatrix);

  mat3.normalFromMat4(nMatrix, mMatrix);
  gl.uniformMatrix3fv(u_NMatrix, false, nMatrix);

  // for (const [key, value] of Object.entries(attrs)) {
  //   const { buffer, componentType, componentsPerAttr } = primitive.attrs[key];
  //   gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //   gl.enableVertexAttribArray(value);
  //   gl.vertexAttribPointer(value, componentsPerAttr, 
  //     componentType, false, 0, 0);
  // }

  // const { buffer, componentType, count } = primitive.indices;
  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
  // gl.drawElements(gl.TRIANGLES, count, componentType, 0);

  // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  // gl.enableVertexAttribArray(a_Pos);
  // gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);

  // gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
  // gl.enableVertexAttribArray(a_Normal);
  // gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  // gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

// ---------------

function createProgram(gl) {
  const vs = getShaderFromElem(gl, 'shader-vs');
  const fs = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vs, fs);
}

function createMatrix(mat) {
  const m = mat.create();
  mat.identity(m);
  return m;
}

function createBuffer(target, data) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

window.addEventListener('load', 
  () => void loadGLTF('assets/tank/tank.gltf', render));