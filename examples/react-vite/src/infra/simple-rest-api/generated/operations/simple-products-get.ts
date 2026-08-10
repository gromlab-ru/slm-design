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
  ProductResponseDto,
  SimpleProductsGetParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Products
 * @name SimpleProductsGet
 * @summary Get one product with ETag support
 * @request GET:/api/v1/products/{id}
 */
export const simpleProductsGet = (
  http: ApiRequestClient,
  { id, ...query }: SimpleProductsGetParams,
  requestParams: RequestParams = {},
) =>
  http.request<ProductResponseDto, void | ErrorResponseDto>({
    path: `/api/v1/products/${id}`,
    method: "GET",
    format: "json",
    ...requestParams,
  });
