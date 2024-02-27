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
   0.0,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
]), gl.STATIC_DRAW);
// ---------------

// Создание буфера цветов
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0,
]), gl.STATIC_DRAW);
// ---------------

// Инициализация данных
const a_Pos = gl.getAttribLocation(program, 'a_Pos');
gl.enableVertexAttribArray(a_Pos);

const a_Color = gl.getAttribLocation(program, 'a_Color');
gl.enableVertexAttribArray(a_Color);
// ---------------

// Отрисовка примитивов
gl.viewport(0, 0, canvas.width, canvas.height);

gl.clearColor(0.0, 0.0, 0.2, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 3);
// ---------------

function createProgram(gl) {
  const vertShader = getShaderFromElem(gl, 'shader-vs');
  const fragShader = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vertShader, fragShader);
}