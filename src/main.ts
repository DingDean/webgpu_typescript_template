
async function setupWebGPU() {
  // Get the GPUDevice handle
  const adapter = await navigator.gpu?.requestAdapter({

  });
  if (!adapter) {
    throw new Error("No adapter found");
  }
  const device = await adapter?.requestDevice();
  if (!device) {
    throw new Error("No device found");
  }

  // Configure the GPUDevice
  const canvas = document.querySelector("canvas");
  const context = canvas?.getContext("webgpu");
  if (!context) {
    throw new Error("No context found");
  }
  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
  });

  // Prepare the vertices for a square
  const vertices = new Float32Array([
    0.5, 0.5,
    0.5, 0.0,
    0.0, 0.0,
    0.5, 0.5,
    0.0, 0.0,
    0.0, 0.5,
  ]);

  // Create the Vertex Buffer
  const vertexBuffer = device.createBuffer({
    label: "vertex buffer",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  // Describe the layout of vertex buffer
  const vertexBufferLayout: GPUVertexBufferLayout = {
    arrayStride: Float32Array.BYTES_PER_ELEMENT * 2,
    attributes: [{
      format: "float32x2",
      offset: 0,
      shaderLocation: 0, // Position, see vertex shader
    }],
  };
  // Copy the vertices to the GPU
  device.queue.writeBuffer(vertexBuffer, 0, vertices);

  // Create the vertex shader
  const vertexShader = device.createShaderModule({
    label: "vertex shader",
    code: `
    struct VertexInput {
      @location(0) pos: vec2<f32>,
      @builtin(instance_index) instance: u32,
    };

      @vertex
      fn vs_main(input: VertexInput) -> @builtin(position) vec4<f32> {
        var output = vec4<f32>(input.pos.x, input.pos.y - f32(input.instance) * 0.7, 0.0, 1.0);
        return output;
      }

      @fragment
      fn fs_main() -> @location(0) vec4<f32> {
        return vec4<f32>(0.0, 1.0, 0.0, 1.0);
      }
    `,
  })

  // create the pipeline
  const pipeline = device.createRenderPipeline({
    label: "pipeline",
    layout: "auto",
    vertex: {
      module: vertexShader,
      entryPoint: "vs_main",
      buffers: [vertexBufferLayout],
    },
    fragment: {
      module: vertexShader,
      entryPoint: "fs_main",
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
      }],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  // Setup our canvas
  const encoder = device.createCommandEncoder();
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 1.0, g: 0.0, b: 0.0, a: 1.0 },
        storeOp: "store",
      },
    ],
  });

  // Draw the square
  renderPass.setPipeline(pipeline);
  renderPass.setVertexBuffer(0, vertexBuffer);
  renderPass.draw(vertices.length / 2, 2);
  renderPass.end();

  device.queue.submit([encoder.finish()]);
}

function main() {
  setupWebGPU();
}

main()