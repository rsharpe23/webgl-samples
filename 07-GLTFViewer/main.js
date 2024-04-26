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

  console.log(JSON.stringify(gltf.scene, null, 1));

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

loadGLTF('assets/cube.gltf', render);

function loadGLTF(url, cb) {
  fetch(url).then(res => res.json())
    .then(data => {
      const { uri } = data.buffers[0];
      fetch(uri).then(res => res.arrayBuffer())
        .then(buffer => {
          data.buffers = [buffer];
          cb && cb(new GLTF(data));
        });
    });
}

const typeUtil = {
  typeMap: {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
  },

  getComponentsNum(attrType) {
    return this.typeMap[attrType];
  }
};

class GLTF {
  constructor(data) {
    this.data = data;
  }

  #meshes = null;
  get meshes() {
    if (!this.#meshes) {
      const { meshes } = this.data;
      this.#meshes = meshes.map(mesh => this.#getMesh(mesh));
    }

    return this.#meshes;
  }

  #scene = null;
  get scene() {
    if (!this.#scene) {
      const { nodes } = this.data.scenes[this.data.scene];
      this.#scene = nodes.map(
        node => this.#getNodeTree(this.data.nodes[node]));
    }

    return this.#scene;
  }

  get arrayBuffer() {
    return this.data.buffers[0];
  }

  // --------

  #getMesh({ name, primitives: p }) {
    const primitives = p.map(item => this.#getMeshPrimitive(item));
    return { name, primitives };
  }
  
  #getMeshPrimitive({ attributes: a, indices: i }) {
    const { accessors } = this.data;

    const attrs = Object.entries(a)
      .reduce((attr, [key, value]) => {
        attr[key] = this.#getAccessor(accessors[value]);
        return attr;
      }, {});
      
    const indices = this.#getAccessor(accessors[i]);

    return { attrs, indices };
  }
  
  #getAccessor({ bufferView: b, type, componentType, count }) {
    const bufferView = this.#getBufferView(this.data.bufferViews[b]);
    const componentsNum = typeUtil.getComponentsNum(type);
    return { bufferView, componentType, componentsNum, count };
  }
  
  #getBufferView({ byteOffset, byteLength, target }) {
    const data = new Uint8Array(this.arrayBuffer, byteOffset, byteLength);
    return { target, data };
  }

  // ---------

  #getNodeTree(rootNode) {
    const node = this.#getNode(rootNode);

    const { children } = rootNode;
    if (children && children.length > 0) {
      node.children = children.map(child => this.#getNodeTree(child));
    }

    return node;
  }

  #getNode({ name, mesh: m, ...rest }) {
    const mesh = this.meshes[m];
    const matrix = trsToMatrix(rest);
    return { name, mesh, matrix };
  }
}

function trsToMatrix(trs) {
  return [];
}