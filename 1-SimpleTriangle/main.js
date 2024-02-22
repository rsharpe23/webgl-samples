const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Создание программы
const program = createProgram(gl);
gl.useProgram(program);
// ---------------

// Создание буфера вершин
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

const vertices = [
   0.0,  0.5, 0.0,
  -0.5, -0.5, 0.0,
   0.5, -0.5, 0.0,
];

gl.bufferData(gl.ARRAY_BUFFER, 
              new Float32Array(vertices), 
              gl.STATIC_DRAW);
// ---------------

// Установка атрибута
const a_Pos = gl.getAttribLocation(program, 'a_Pos');
gl.enableVertexAttribArray(a_Pos);
gl.vertexAttribPointer(a_Pos, 3, gl.FLOAT, false, 0, 0);
// ---------------

// Очистка экрана                
gl.clearColor(1.0, 0.0, 0.0, 0.5);
gl.clear(gl.COLOR_BUFFER_BIT);
// ---------------

// Отрисовка примитивов
gl.viewport(0, 0, canvas.width, canvas.height);
gl.drawArrays(gl.TRIANGLES, 0, 3);
// ---------------

function createProgram(gl) {
  const vertShader = getShaderFromElem(gl, 'shader-vs');
  const fragShader = getShaderFromElem(gl, 'shader-fs');
  return createShaderProgram(gl, vertShader, fragShader);
}