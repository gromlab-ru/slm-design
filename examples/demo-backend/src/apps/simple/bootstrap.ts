import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { OpenAPIObject } from "@nestjs/swagger";
import { configureApplication } from "../../common/configure-application";
import { createOpenApiDocument, mountOpenApi } from "../../common/openapi";
import { SimpleAppModule } from "./simple.module";

export async function createSimpleApplication(
  logger: false | undefined = undefined,
): Promise<{ app: NestExpressApplication; document: OpenAPIObject }> {
  const app = await NestFactory.create<NestExpressApplication>(
    SimpleAppModule,
    { logger },
  );
  configureApplication(app);
  const port = Number(process.env.SIMPLE_PORT ?? 3001);
  const document = createOpenApiDocument(app, { kind: "simple", port });
  mountOpenApi(app, document, "Demo Simple API");
  return { app, document };
}
