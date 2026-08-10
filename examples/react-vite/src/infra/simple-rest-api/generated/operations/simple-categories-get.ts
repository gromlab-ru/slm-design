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
  CategoryResponseDto,
  ErrorResponseDto,
  SimpleCategoriesGetParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Categories
 * @name SimpleCategoriesGet
 * @summary Get one category
 * @request GET:/api/v1/categories/{id}
 */
export const simpleCategoriesGet = (
  http: ApiRequestClient,
  { id, ...query }: SimpleCategoriesGetParams,
  requestParams: RequestParams = {},
) =>
  http.request<CategoryResponseDto, ErrorResponseDto>({
    path: `/api/v1/categories/${id}`,
    method: "GET",
    format: "json",
    ...requestParams,
  });
