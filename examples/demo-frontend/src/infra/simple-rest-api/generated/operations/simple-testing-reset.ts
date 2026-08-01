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

import type { TestingActionResponseDto } from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Testing
 * @name SimpleTestingReset
 * @summary Reset all Simple API state and token revocations
 * @request POST:/api/v1/testing/reset
 */
export const simpleTestingReset = (
  http: ApiRequestClient,
  requestParams: RequestParams = {},
) =>
  http.request<TestingActionResponseDto, any>({
    path: `/api/v1/testing/reset`,
    method: "POST",
    format: "json",
    ...requestParams,
  });
