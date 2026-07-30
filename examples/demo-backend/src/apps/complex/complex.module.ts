import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../../common/infrastructure.module";
import {
  ComplexCookieGuard,
  ComplexCsrfGuard,
  ComplexOrganizationGuard,
  ComplexRolesGuard,
  ComplexSessionService,
} from "./complex.auth";
import { ComplexStore } from "./complex.store";
import { ChatGateway } from "./chat.gateway";
import { ChatController } from "./controllers/chat.controller";
import {
  ComplexCatalogController,
  ComplexInventoryController,
  ComplexProductsController,
} from "./controllers/catalog.controllers";
import {
  ComplexOrdersController,
  CustomersController,
  PaymentsController,
  ReviewsController,
} from "./controllers/commerce.controllers";
import {
  ComplexAuthController,
  ComplexUsersController,
  OrganizationsController,
} from "./controllers/identity.controllers";
import {
  AuditController,
  FilesController,
  JobsController,
  NotificationsController,
} from "./controllers/operations.controllers";
import {
  ComplexHealthController,
  ComplexTestingController,
} from "./controllers/system.controllers";

@Module({
  imports: [InfrastructureModule],
  controllers: [
    ComplexHealthController,
    ComplexAuthController,
    ComplexUsersController,
    OrganizationsController,
    ComplexProductsController,
    ComplexCatalogController,
    ComplexInventoryController,
    CustomersController,
    ComplexOrdersController,
    PaymentsController,
    ReviewsController,
    NotificationsController,
    FilesController,
    AuditController,
    JobsController,
    ChatController,
    ComplexTestingController,
  ],
  providers: [
    ComplexStore,
    ComplexSessionService,
    ComplexCookieGuard,
    ComplexCsrfGuard,
    ComplexOrganizationGuard,
    ComplexRolesGuard,
    ChatGateway,
  ],
})
export class ComplexAppModule {}
