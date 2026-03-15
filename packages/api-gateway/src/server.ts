import { startApiGateway } from './index.js';

async function start() {
  try {
    await startApiGateway();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (process.env.PAYER_PORTAL_API_GATEWAY_AUTOSTART !== 'false') {
  void start();
}
