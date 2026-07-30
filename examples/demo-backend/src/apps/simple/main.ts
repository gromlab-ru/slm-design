import { createSimpleApplication } from "./bootstrap";

async function bootstrap(): Promise<void> {
  const { app } = await createSimpleApplication();
  const port = Number(process.env.SIMPLE_PORT ?? 3001);
  await app.listen(port);
  console.log(`Simple API: http://localhost:${port}/api/v1`);
  console.log(`Simple Swagger: http://localhost:${port}/docs`);
}

void bootstrap();
