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

import type { CategoriesResponseDto } from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Categories
 * @name SimpleCategoriesList
 * @summary List product categories
 * @request GET:/api/v1/categories
 */
export const simpleCategoriesList = (
  http: ApiRequestClient,
  requestParams: RequestParams = {},
) =>
  http.request<CategoriesResponseDto, any>({
    path: `/api/v1/categories`,
    method: "GET",
    format: "json",
    ...requestParams,
  });
