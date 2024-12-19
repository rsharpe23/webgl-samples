const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const { width, height } = canvas;
const { mat4, mat3, quat, vec3 } = glMatrix;

const matrixStack = {
  items: [],

  push(matrix) {
    const temp = mat4.create();
    mat4.copy(temp, matrix);
    this.items.push(temp);
  },
  
  pop(matrix) {
    if (this.items.length > 0) {
      matrix.set(this.items.pop());
    }
  },  
};

const prog = createProgram(gl);

window.addEventListener('load', () => {
  loadGLTF('assets/tank', render);
});

function render(gltf) {
  const pMatrix = createMatrix(mat4);
  const vMatrix = createMatrix(mat4);
  // const mMatrix = createMatrix(mat4);
  // const nMatrix = createMatrix(mat3);
  const nMatrix = createMatrix(mat4);
  const mvMatrix = createMatrix(mat4);

  const u_PMatrix = gl.getUniformLocation(prog, 'u_PMatrix');
  // const u_VMatrix = gl.getUniformLocation(prog, 'u_VMatrix');
  // const u_MMatrix = gl.getUniformLocation(prog, 'u_MMatrix');
  const u_NMatrix = gl.getUniformLocation(prog, 'u_NMatrix');
  const u_MVMatrix = gl.getUniformLocation(prog, 'u_MVMatrix');

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

  const scene = gltf.getScene();

  traverse(scene, node => {
    const { primitives } = node.mesh;
    for (const { attributes, indices } of primitives) {
      for (const key in attributes) {
        if (Object.hasOwnProperty.call(attributes, key)) {
          attributes[key].buffer = createBuffer(attributes[key].bufferView);
          attributes[key].numComponents = getNumberOfComponents(attributes[key].type);
        }
      }

      indices.buffer = createBuffer(indices.bufferView);
    }
  });

  gl.clearColor(0.0, 0.0, 0.14, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.useProgram(prog);

  // Отрисовка

  gl.viewport(0, 0, width, height);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(pMatrix, 1.04, width / height, 0.1, 100.0);
  gl.uniformMatrix4fv(u_PMatrix, false, pMatrix);

  // const rot = quat.create();
  // quat.fromEuler(rot, 20.0, 180.0, 0.0);
  // const eye = vec3.create();
  // vec3.transformQuat(eye, [0.0, 0.0, -8.0], rot);

  mat4.lookAt(vMatrix, [10.0, 0.0, 10.0], [0.0, 0.0, 0.0], [0, 1, 0]);
  // gl.uniformMatrix4fv(u_VMatrix, false, vMatrix);

  mat4.multiply(mvMatrix, mvMatrix, vMatrix);

  gl.uniform3fv(u_AmbientLightColor, [0.3, 0.3, 0.3]);
  gl.uniform3fv(u_DiffuseLightColor, [0.7, 0.7, 0.7]);
  gl.uniform3fv(u_SpecularLightColor, [1.0, 1.0, 1.0]);
  gl.uniform3fv(u_LightPos, [0.0, 100.0, 0.0]);

  gl.uniform3fv(u_AmbientMaterialColor, [0.6, 0.9, 0.3]);
  gl.uniform3fv(u_DiffuseMaterialColor, [0.7, 0.7, 0.7]);
  gl.uniform3fv(u_SpecularMaterialColor, [1.0, 1.0, 1.0]);

  traverse(scene, ({ translation, rotation, mesh }) => {
    translation && mat4.translate(mvMatrix, mvMatrix, translation);
    if (rotation) {
      const [x, y, z, w] = rotation;
      const angle = Math.acos(w) * 2; // w - это косинус половины угла
      mat4.rotate(mvMatrix, mvMatrix, angle, [x, y, z]);
    }
    gl.uniformMatrix4fv(u_MVMatrix, false, mvMatrix);

    const invertMatrix = mat4.create();
    mat4.invert(invertMatrix, mvMatrix);
    mat4.transpose(nMatrix, invertMatrix);
    gl.uniformMatrix4fv(u_NMatrix, false, nMatrix);

    // mat4.mul(mvMatrix, vMatrix, mMatrix);
    // mat3.normalFromMat4(nMatrix, mvMatrix);
    // gl.uniformMatrix3fv(u_NMatrix, false, nMatrix);

    for (const { attributes, indices } of mesh.primitives) {
      for (const [key, value] of Object.entries(attrs)) {
        const { buffer, componentType, numComponents } = attributes[key];
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.enableVertexAttribArray(value);
        gl.vertexAttribPointer(value, numComponents, 
          componentType, false, 0, 0);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices.buffer);
      gl.drawElements(gl.TRIANGLES, indices.count, indices.componentType, 0);
    }
  }, fn => {
    return node => {
      matrixStack.push(mvMatrix);
      fn.call(null, node);
      matrixStack.pop(mvMatrix);
    };
  });
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

function createBuffer({ target, data }) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

function traverse(scene, cb, proxy) {
  proxy && (fn = proxy(fn));
  scene.forEach(fn);

  function fn(node) {
    cb && cb(node);
    const { children } = node;
    children && children.forEach(fn);
  }
}

function getNumberOfComponents(attrType) {
  const typeMap = {
    'SCALAR': 1,
    'VEC2': 2,
    'VEC3': 3,
  };

  return typeMap[attrType];
}

function degToRad(angle) {
  return angle * Math.PI / 180;
}