import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createComplexApplication } from "../apps/complex/bootstrap";
import { createSimpleApplication } from "../apps/simple/bootstrap";

async function generate(): Promise<void> {
  const outputDirectory = resolve(process.cwd(), "openapi");
  await mkdir(outputDirectory, { recursive: true });

  const simple = await createSimpleApplication(false);
  await simple.app.init();
  await writeFile(
    resolve(outputDirectory, "simple.json"),
    `${JSON.stringify(simple.document, null, 2)}\n`,
    "utf8",
  );
  await simple.app.close();

  const complex = await createComplexApplication(false);
  await complex.app.init();
  await writeFile(
    resolve(outputDirectory, "complex.json"),
    `${JSON.stringify(complex.document, null, 2)}\n`,
    "utf8",
  );
  await complex.app.close();

  console.log("Generated openapi/simple.json and openapi/complex.json");
}

void generate().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
