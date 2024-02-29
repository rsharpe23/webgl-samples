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
  // лицевая часть
  -0.5, -0.5, 0.5,
  -0.5,  0.5, 0.5,
   0.5,  0.5, 0.5,
   0.5, -0.5, 0.5,
  // задняя часть
  -0.5, -0.5, -0.5,
  -0.5,  0.5, -0.5,
   0.5,  0.5, -0.5,
   0.5, -0.5, -0.5,
]), gl.STATIC_DRAW);
// ---------------

// Создание буфера индексов
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
  // лицевая часть
  0, 1, 2,  2, 3, 0,
  // нижняя часть
  0, 4, 7,  7, 3, 0,
  // левая часть
  0, 1, 5,  5, 4, 0,
  // правая часть
  2, 3, 7,  7, 6, 2,
  // верхняя часть
  2, 1, 6,  6, 5, 1,
  // задняя часть
  4, 5, 6,  6, 7, 4,
]), gl.STATIC_DRAW);
// ---------------

// Создание буфера цветов
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  // лицевая часть
  0.0, 0.0, 0.5,
  0.0, 0.0, 1.0,
  0.0, 1.0, 0.0,
  0.0, 0.5, 0.0,
  // задняя часть
  0.0, 0.0, 0.5,
  0.0, 0.0, 1.0,
  0.0, 1.0, 0.0,
  0.0, 0.5, 0.0,
]), gl.STATIC_DRAW);
// ---------------

// Инициализация данных
const { width, height } = canvas;
const { mat4, vec3, quat } = glMatrix;

let euler = { x: 0.0, y: 0.0 };

const pMatrix = mat4.create();
const mvMatrix = mat4.create();

const a_Pos = gl.getAttribLocation(program, 'a_Pos');
gl.enableVertexAttribArray(a_Pos);

const a_Color = gl.getAttribLocation(program, 'a_Color');
gl.enableVertexAttribArray(a_Color);

const u_PMatrix = gl.getUniformLocation(program, 'u_PMatrix');
const u_MVMatrix = gl.getUniformLocation(program, 'u_MVMatrix');
// ---------------

(function render(elapsedTime) {
  gl.viewport(0, 0, width, height);
  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.0, 0.0, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 1.04, width / height, 0.1, 100.0);
  mat4.identity(mvMatrix);

  const ex = euler.x * 5;
  const ey = euler.y * 5;

  const eRot = quat.create();
  quat.fromEuler(eRot, ex, ey, 0.0);

  const eye = vec3.create();
  vec3.transformQuat(eye, [0.0, 0.0, -3.0], eRot);

  mat4.lookAt(mvMatrix, eye, [0.0, 0.0, 0.0], [0, 1, 0]);

  gl.uniformMatrix4fv(u_PMatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_MVMatrix, false, mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
})(0);

document.addEventListener('keydown', e => {
  switch (e.code) {
    case 'ArrowUp': euler.x++; break;
    case 'ArrowDown': euler.x--; break;
    case 'ArrowRight': euler.y++; break;
    case 'ArrowLeft': euler.y--; break;
  }
});

function createProgram(gl) {
  const vertShader = getShaderFromElem(gl, 'shader-vs');
  const fragShader = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vertShader, fragShader);
}