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
  SimpleUserResponseDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Users
 * @name SimpleUsersMe
 * @summary Get the authenticated user
 * @request GET:/api/v1/users/me
 * @secure
 */
export const simpleUsersMe = (
  http: ApiRequestClient,
  requestParams: RequestParams = {},
) =>
  http.request<SimpleUserResponseDto, ErrorResponseDto>({
    path: `/api/v1/users/me`,
    method: "GET",
    secure: true,
    format: "json",
    ...requestParams,
  });
