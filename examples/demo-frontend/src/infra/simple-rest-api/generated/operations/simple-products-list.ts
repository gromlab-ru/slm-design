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
  ProductsResponseDto,
  SimpleProductsListParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Products
 * @name SimpleProductsList
 * @summary List products using offset pagination, filters and sorting
 * @request GET:/api/v1/products
 */
export const simpleProductsList = (
  http: ApiRequestClient,
  query: SimpleProductsListParams,
  requestParams: RequestParams = {},
) =>
  http.request<ProductsResponseDto, ErrorResponseDto>({
    path: `/api/v1/products`,
    method: "GET",
    query: query,
    format: "json",
    ...requestParams,
  });
