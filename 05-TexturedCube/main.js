const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Создание программы
const program = createProgram(gl);
gl.useProgram(program);
// ---------------

// Создание текстуры
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

const u_Sampler = gl.getUniformLocation(program, 'u_Sampler');
gl.uniform1i(u_Sampler, 0);
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

// Создание буфера текстурных координат
const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,

  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,

  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,

  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,

  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,

  0.0, 0.0,
  0.0, 1.0,
  1.0, 1.0,
  1.0, 0.0,
]), gl.STATIC_DRAW);
//----------------

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
const { mat4 } = glMatrix;

const pMatrix = mat4.create();
const mvMatrix = mat4.create();

const a_Pos = gl.getAttribLocation(program, 'a_Pos');
gl.enableVertexAttribArray(a_Pos);

const a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');
gl.enableVertexAttribArray(a_TexCoord);

const u_PMatrix = gl.getUniformLocation(program, 'u_PMatrix');
const u_MVMatrix = gl.getUniformLocation(program, 'u_MVMatrix');
// ---------------

window.addEventListener('load', () => {
  const img = document.getElementById('texture');
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, 
                gl.UNSIGNED_BYTE, img);

  render(0)
});

function render(elapsedTime) {
  gl.viewport(0, 0, width, height);
  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.0, 0.0, 0.14, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 1.04, width / height, 0.1, 100.0);
  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, mvMatrix, [0.0, 0.0, -3.0]);
  const angle = elapsedTime * 0.001;
  mat4.rotate(mvMatrix, mvMatrix, angle, [1, 1, 0]);

  gl.uniformMatrix4fv(u_PMatrix, false, pMatrix);
  gl.uniformMatrix4fv(u_MVMatrix, false, mvMatrix);

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

  requestAnimationFrame(render);
};
// ---------------

function createProgram(gl) {
  const vertShader = getShaderFromElem(gl, 'shader-vs');
  const fragShader = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vertShader, fragShader);
}