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
  CreateProductDto,
  ErrorResponseDto,
  ProductResponseDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Products
 * @name SimpleProductsCreate
 * @summary Create a product as an administrator
 * @request POST:/api/v1/products
 * @secure
 */
export const simpleProductsCreate = (
  http: ApiRequestClient,
  data: CreateProductDto,
  requestParams: RequestParams = {},
) =>
  http.request<ProductResponseDto, ErrorResponseDto>({
    path: `/api/v1/products`,
    method: "POST",
    body: data,
    secure: true,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
