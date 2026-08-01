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
  SimpleProductsUpdateParams,
  UpdateProductDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Products
 * @name SimpleProductsUpdate
 * @summary Update a product using optimistic locking
 * @request PATCH:/api/v1/products/{id}
 * @secure
 */
export const simpleProductsUpdate = (
  http: ApiRequestClient,
  { id, ...query }: SimpleProductsUpdateParams,
  data: UpdateProductDto,
  requestParams: RequestParams = {},
) =>
  http.request<ProductResponseDto, ErrorResponseDto>({
    path: `/api/v1/products/${id}`,
    method: "PATCH",
    body: data,
    secure: true,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
