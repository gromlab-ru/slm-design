import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { InfrastructureModule } from "../../common/infrastructure.module";
import {
  SimpleAdminGuard,
  SimpleAuthService,
  SimpleJwtGuard,
} from "./simple.auth";
import {
  SimpleAuthController,
  SimpleCategoriesController,
  SimpleHealthController,
  SimpleOrdersController,
  SimpleProductsController,
  SimpleTestingController,
  SimpleUsersController,
} from "./simple.controllers";
import { SimpleStore } from "./simple.store";

@Module({
  imports: [InfrastructureModule, JwtModule.register({})],
  controllers: [
    SimpleHealthController,
    SimpleAuthController,
    SimpleUsersController,
    SimpleProductsController,
    SimpleCategoriesController,
    SimpleOrdersController,
    SimpleTestingController,
  ],
  providers: [SimpleStore, SimpleAuthService, SimpleJwtGuard, SimpleAdminGuard],
})
export class SimpleAppModule {}
