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

import type { HealthResponseDto } from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Health
 * @name SimpleHealthHealth
 * @summary Check Simple API availability
 * @request GET:/api/v1/health
 */
export const simpleHealthHealth = (
  http: ApiRequestClient,
  requestParams: RequestParams = {},
) =>
  http.request<HealthResponseDto, any>({
    path: `/api/v1/health`,
    method: "GET",
    format: "json",
    ...requestParams,
  });
