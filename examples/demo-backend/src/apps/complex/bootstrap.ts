import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { OpenAPIObject } from "@nestjs/swagger";
import { configureApplication } from "../../common/configure-application";
import { createOpenApiDocument, mountOpenApi } from "../../common/openapi";
import { ComplexAppModule } from "./complex.module";

export async function createComplexApplication(
  logger: false | undefined = undefined,
): Promise<{ app: NestExpressApplication; document: OpenAPIObject }> {
  const app = await NestFactory.create<NestExpressApplication>(
    ComplexAppModule,
    { logger },
  );
  configureApplication(app);
  const port = Number(process.env.COMPLEX_PORT ?? 3002);
  const document = createOpenApiDocument(app, { kind: "complex", port });
  mountOpenApi(app, document, "Demo Complex API");
  return { app, document };
}
