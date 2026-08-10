/* eslint-disable */
/* tslint:disable */
// @ts-nocheck

/*
 * ----------------------------------------------------------------------
 * ## АВТОМАТИЧЕСКИ СГЕНЕРИРОВАННЫЙ ФАЙЛ                               ##
 * ##                                                                  ##
 * ## Не редактируйте вручную: изменения будут перезаписаны.           ##
 * ## Для изменений перегенерируйте клиент.                            ##
 * ##                                                                  ##
 * ## Генератор: @gromlab/api-codegen                                  ##
 * ## Репозиторий: https://gromlab.ru/gromov/api-codegen               ##
 * ----------------------------------------------------------------------
 */

import { simpleAuthLogin } from "./operations/simple-auth-login";
import { simpleAuthLogout } from "./operations/simple-auth-logout";
import { simpleAuthRefresh } from "./operations/simple-auth-refresh";
import { simpleCategoriesGet } from "./operations/simple-categories-get";
import { simpleCategoriesList } from "./operations/simple-categories-list";
import { simpleHealthHealth } from "./operations/simple-health-health";
import { simpleOrdersCancel } from "./operations/simple-orders-cancel";
import { simpleOrdersCreate } from "./operations/simple-orders-create";
import { simpleOrdersGet } from "./operations/simple-orders-get";
import { simpleOrdersList } from "./operations/simple-orders-list";
import { simpleProductsCreate } from "./operations/simple-products-create";
import { simpleProductsGet } from "./operations/simple-products-get";
import { simpleProductsList } from "./operations/simple-products-list";
import { simpleProductsRemove } from "./operations/simple-products-remove";
import { simpleProductsUpdate } from "./operations/simple-products-update";
import { simpleTestingChangeRole } from "./operations/simple-testing-change-role";
import { simpleTestingReset } from "./operations/simple-testing-reset";
import { simpleTestingScenarios } from "./operations/simple-testing-scenarios";
import { simpleTestingSeed } from "./operations/simple-testing-seed";
import { simpleUsersMe } from "./operations/simple-users-me";

export const operationsTree = {
  health: {
    simpleHealthHealth: simpleHealthHealth,
  },
  auth: {
    simpleAuthLogin: simpleAuthLogin,
    simpleAuthRefresh: simpleAuthRefresh,
    simpleAuthLogout: simpleAuthLogout,
  },
  users: {
    simpleUsersMe: simpleUsersMe,
  },
  products: {
    simpleProductsList: simpleProductsList,
    simpleProductsCreate: simpleProductsCreate,
    simpleProductsGet: simpleProductsGet,
    simpleProductsUpdate: simpleProductsUpdate,
    simpleProductsRemove: simpleProductsRemove,
  },
  categories: {
    simpleCategoriesList: simpleCategoriesList,
    simpleCategoriesGet: simpleCategoriesGet,
  },
  orders: {
    simpleOrdersList: simpleOrdersList,
    simpleOrdersCreate: simpleOrdersCreate,
    simpleOrdersGet: simpleOrdersGet,
    simpleOrdersCancel: simpleOrdersCancel,
  },
  testing: {
    simpleTestingScenarios: simpleTestingScenarios,
    simpleTestingReset: simpleTestingReset,
    simpleTestingSeed: simpleTestingSeed,
    simpleTestingChangeRole: simpleTestingChangeRole,
  },
} as const;

export type OperationsTree = typeof operationsTree;
