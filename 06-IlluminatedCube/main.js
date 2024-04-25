const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Создание программы
const program = createProgram(gl);
gl.useProgram(program);
// ---------------

// Создание буфера вершин
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  //лицевая часть
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5, -0.5,  0.5,
  // задняя часть
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
  // левая часть
  -0.5, -0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,
  // правая часть
   0.5, -0.5,  0.5,
   0.5,  0.5,  0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
  // верхняя часть
  -0.5,  0.5,  0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5,  0.5,  0.5,
  // нижняя часть
  -0.5, -0.5,  0.5,
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,
   0.5, -0.5,  0.5,
]), gl.STATIC_DRAW);
// ---------------

// Создание буфера нормалей
const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.0, 0.0, 1.0,
  0.0, 0.0, 1.0,
  0.0, 0.0, 1.0,
  0.0, 0.0, 1.0,

  0.0, 0.0, -1.0,
  0.0, 0.0, -1.0,
  0.0, 0.0, -1.0,
  0.0, 0.0, -1.0,

  -1.0, 0.0, 0.0,
  -1.0, 0.0, 0.0,
  -1.0, 0.0, 0.0,
  -1.0, 0.0, 0.0,

  1.0, 0.0, 0.0,
  1.0, 0.0, 0.0,
  1.0, 0.0, 0.0,
  1.0, 0.0, 0.0,

  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 1.0, 0.0,

  0.0, -1.0, 0.0,
  0.0, -1.0, 0.0,
  0.0, -1.0, 0.0,
  0.0, -1.0, 0.0,
]), gl.STATIC_DRAW);
// ---------------

// Создание буфера индексов
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
  // лицевая часть
  0, 1, 2,  2, 3, 0,
  // задняя часть
  4, 5, 6,  6, 7, 4,
  // левая часть
  8, 9, 10,  10, 11, 8,
  // правая часть
  12, 13, 14,  14, 15, 12,
  // верхняя часть
  16, 17, 18,  18, 19, 16,
  // нижняя часть
  20, 21, 22,  22, 23, 20,
]), gl.STATIC_DRAW);
// ---------------

// Инициализация данных
const { width, height } = canvas;
const { mat4, mat3 } = glMatrix;

const pMatrix = mat4.create();
const mvMatrix = mat4.create();
const nMatrix = mat3.create();

const a_Pos = gl.getAttribLocation(program, 'a_Pos');
gl.enableVertexAttribArray(a_Pos);

const a_Normal = gl.getAttribLocation(program, 'a_Normal');
gl.enableVertexAttribArray(a_Normal);

const u_PMatrix = gl.getUniformLocation(program, 'u_PMatrix');
const u_MVMatrix = gl.getUniformLocation(program, 'u_MVMatrix');
const u_NMatrix = gl.getUniformLocation(program, 'u_NMatrix');

const u_LightPos = gl.getUniformLocation(program, 'u_LightPos');
gl.uniform3fv(u_LightPos, [0.0, 8.0, 6.0]);

const u_AmbientMaterialColor = gl.getUniformLocation(program, 'u_AmbientMaterialColor');
const u_DiffuseMaterialColor = gl.getUniformLocation(program, 'u_DiffuseMaterialColor');
const u_SpecularMaterialColor = gl.getUniformLocation(program, 'u_SpecularMaterialColor');

const u_AmbientLightColor = gl.getUniformLocation(program, 'u_AmbientLightColor');
const u_DiffuseLightColor = gl.getUniformLocation(program, 'u_DiffuseLightColor');
const u_SpecularLightColor = gl.getUniformLocation(program, 'u_SpecularLightColor');

gl.uniform3fv(u_AmbientMaterialColor, [0.6, 0.9, 0.3]);
gl.uniform3fv(u_DiffuseMaterialColor, [0.7, 0.7, 0.7]);
gl.uniform3fv(u_SpecularMaterialColor, [1.0, 1.0, 1.0]);

gl.uniform3fv(u_AmbientLightColor, [0.3, 0.3, 0.3]);
gl.uniform3fv(u_DiffuseLightColor, [0.7, 0.7, 0.7]);
gl.uniform3fv(u_SpecularLightColor, [1.0, 1.0, 1.0]);
// ---------------

(function render(elapsedTime) {
  gl.viewport(0, 0, width, height);
  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.0, 0.0, 0.14, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 1.04, width / height, 0.1, 100.0);
  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -3.0]);
  const angle = elapsedTime * 0.001;
  mat4.rotate(mvMatrix, mvMatrix, angle, [1, 1, 0]);

  mat3.normalFromMat4(nMatrix, mvMatrix);

  gl.uniformMatrix4fv(u_PMatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_MVMatrix, false, mvMatrix);
  gl.uniformMatrix3fv(u_NMatrix, false, nMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
})(0);

function createProgram(gl) {
  const vertShader = getShaderFromElem(gl, 'shader-vs');
  const fragShader = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vertShader, fragShader);
}