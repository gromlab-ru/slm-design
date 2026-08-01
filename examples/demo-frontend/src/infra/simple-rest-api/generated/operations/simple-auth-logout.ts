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

import type { ErrorResponseDto, RefreshTokenDto } from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Auth
 * @name SimpleAuthLogout
 * @summary Revoke a refresh token; the operation is idempotent
 * @request POST:/api/v1/auth/logout
 */
export const simpleAuthLogout = (
  http: ApiRequestClient,
  data: RefreshTokenDto,
  requestParams: RequestParams = {},
) =>
  http.request<void, ErrorResponseDto>({
    path: `/api/v1/auth/logout`,
    method: "POST",
    body: data,
    type: ContentType.Json,
    ...requestParams,
  });
