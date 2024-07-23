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
  renderPass.end();
  device.queue.submit([encoder.finish()]);
}

function main() {
  setupWebGPU();
}

main()