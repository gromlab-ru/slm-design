import { Global, Module } from "@nestjs/common";
import { ApiExceptionFilter } from "./api-exception.filter";
import { ObservabilityInterceptor } from "./observability.interceptor";
import { ScenarioInterceptor } from "./scenario.interceptor";

@Global()
@Module({
  providers: [
    ApiExceptionFilter,
    ObservabilityInterceptor,
    ScenarioInterceptor,
  ],
  exports: [ApiExceptionFilter, ObservabilityInterceptor, ScenarioInterceptor],
})
export class InfrastructureModule {}
