import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import SwaggerParser from "@apidevtools/swagger-parser";
import type { OpenAPIObject } from "@nestjs/swagger";

interface ContractExpectation {
  file: string;
  requiredSecuritySchemes: string[];
  requiredPath: string;
  forbiddenPath: string;
}

async function validateContract(
  expectation: ContractExpectation,
): Promise<void> {
  const filePath = resolve(process.cwd(), "openapi", expectation.file);
  await SwaggerParser.validate(filePath);
  const document = JSON.parse(
    await readFile(filePath, "utf8"),
  ) as OpenAPIObject;
  const operationIds = new Set<string>();
  let operationCount = 0;

  for (const pathItem of Object.values(document.paths)) {
    if (!pathItem) continue;
    for (const method of [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "options",
      "head",
    ] as const) {
      const operation = pathItem[method] as
        { operationId?: string } | undefined;
      if (!operation) continue;
      operationCount += 1;
      if (!operation.operationId)
        throw new Error(
          `${expectation.file}: ${method.toUpperCase()} operation has no operationId.`,
        );
      if (operationIds.has(operation.operationId))
        throw new Error(
          `${expectation.file}: duplicate operationId ${operation.operationId}.`,
        );
      operationIds.add(operation.operationId);
    }
  }

  if (!document.paths[expectation.requiredPath])
    throw new Error(
      `${expectation.file}: required path ${expectation.requiredPath} is missing.`,
    );
  if (document.paths[expectation.forbiddenPath])
    throw new Error(
      `${expectation.file}: path ${expectation.forbiddenPath} leaked from the other application.`,
    );
  for (const scheme of expectation.requiredSecuritySchemes) {
    if (!document.components?.securitySchemes?.[scheme])
      throw new Error(
        `${expectation.file}: security scheme ${scheme} is missing.`,
      );
  }
  if (operationCount < 10)
    throw new Error(
      `${expectation.file}: suspiciously small contract (${operationCount} operations).`,
    );
  console.log(
    `Validated ${expectation.file}: ${operationCount} operations, ${operationIds.size} unique operation IDs.`,
  );
}

async function validate(): Promise<void> {
  await validateContract({
    file: "simple.json",
    requiredSecuritySchemes: ["jwt"],
    requiredPath: "/api/v1/products",
    forbiddenPath: "/api/v1/organizations",
  });
  await validateContract({
    file: "complex.json",
    requiredSecuritySchemes: ["cookieSession", "csrf"],
    requiredPath: "/api/v1/organizations",
    forbiddenPath: "/api/v1/auth/refresh-token",
  });
}

void validate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
