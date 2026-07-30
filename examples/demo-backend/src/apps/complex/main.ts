import { createComplexApplication } from "./bootstrap";

async function bootstrap(): Promise<void> {
  const { app } = await createComplexApplication();
  const port = Number(process.env.COMPLEX_PORT ?? 3002);
  await app.listen(port);
  console.log(`Complex API: http://localhost:${port}/api/v1`);
  console.log(`Complex Swagger: http://localhost:${port}/docs`);
  console.log(`Complex Socket.IO namespace: ws://localhost:${port}/chat`);
}

void bootstrap();
