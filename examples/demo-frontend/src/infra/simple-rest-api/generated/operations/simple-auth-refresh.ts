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
  ErrorResponseDto,
  JwtAuthResponseDto,
  RefreshTokenDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Auth
 * @name SimpleAuthRefresh
 * @summary Rotate a refresh token and issue a new token pair
 * @request POST:/api/v1/auth/refresh
 */
export const simpleAuthRefresh = (
  http: ApiRequestClient,
  data: RefreshTokenDto,
  requestParams: RequestParams = {},
) =>
  http.request<JwtAuthResponseDto, ErrorResponseDto>({
    path: `/api/v1/auth/refresh`,
    method: "POST",
    body: data,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
