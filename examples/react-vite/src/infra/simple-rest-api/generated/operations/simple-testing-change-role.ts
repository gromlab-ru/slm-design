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
  ChangeSimpleRoleDto,
  ErrorResponseDto,
  SimpleTestingChangeRoleParams,
  SimpleUserResponseDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Testing
 * @name SimpleTestingChangeRole
 * @summary Change a user role to exercise dynamic access control
 * @request POST:/api/v1/testing/users/{userId}/role
 */
export const simpleTestingChangeRole = (
  http: ApiRequestClient,
  { userId, ...query }: SimpleTestingChangeRoleParams,
  data: ChangeSimpleRoleDto,
  requestParams: RequestParams = {},
) =>
  http.request<SimpleUserResponseDto, ErrorResponseDto>({
    path: `/api/v1/testing/users/${userId}/role`,
    method: "POST",
    body: data,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
