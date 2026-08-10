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
  LoginDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Auth
 * @name SimpleAuthLogin
 * @summary Login and receive JWT access/refresh tokens
 * @request POST:/api/v1/auth/login
 */
export const simpleAuthLogin = (
  http: ApiRequestClient,
  data: LoginDto,
  requestParams: RequestParams = {},
) =>
  http.request<JwtAuthResponseDto, ErrorResponseDto>({
    path: `/api/v1/auth/login`,
    method: "POST",
    body: data,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
