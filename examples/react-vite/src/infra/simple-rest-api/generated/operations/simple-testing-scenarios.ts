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

import type { ScenariosResponseDto } from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Testing
 * @name SimpleTestingScenarios
 * @summary List deterministic X-Demo-Scenario values
 * @request GET:/api/v1/testing/scenarios
 */
export const simpleTestingScenarios = (
  http: ApiRequestClient,
  requestParams: RequestParams = {},
) =>
  http.request<ScenariosResponseDto, any>({
    path: `/api/v1/testing/scenarios`,
    method: "GET",
    format: "json",
    ...requestParams,
  });
