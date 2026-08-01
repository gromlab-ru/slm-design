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

import type {
  SimpleTestingSeedParams,
  TestingActionResponseDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Testing
 * @name SimpleTestingSeed
 * @summary Select a small or large deterministic dataset
 * @request POST:/api/v1/testing/seed/{preset}
 */
export const simpleTestingSeed = (
  http: ApiRequestClient,
  { preset, ...query }: SimpleTestingSeedParams,
  requestParams: RequestParams = {},
) =>
  http.request<TestingActionResponseDto, any>({
    path: `/api/v1/testing/seed/${preset}`,
    method: "POST",
    format: "json",
    ...requestParams,
  });
