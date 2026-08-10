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
  MutationResponseDto,
  SimpleProductsRemoveParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Products
 * @name SimpleProductsRemove
 * @summary Delete a product as an administrator
 * @request DELETE:/api/v1/products/{id}
 * @secure
 */
export const simpleProductsRemove = (
  http: ApiRequestClient,
  { id, ...query }: SimpleProductsRemoveParams,
  requestParams: RequestParams = {},
) =>
  http.request<MutationResponseDto, ErrorResponseDto>({
    path: `/api/v1/products/${id}`,
    method: "DELETE",
    secure: true,
    format: "json",
    ...requestParams,
  });
