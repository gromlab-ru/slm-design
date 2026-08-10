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
  OrdersResponseDto,
  SimpleOrdersListParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Orders
 * @name SimpleOrdersList
 * @summary List orders visible to the current user
 * @request GET:/api/v1/orders
 * @secure
 */
export const simpleOrdersList = (
  http: ApiRequestClient,
  query: SimpleOrdersListParams,
  requestParams: RequestParams = {},
) =>
  http.request<OrdersResponseDto, ErrorResponseDto>({
    path: `/api/v1/orders`,
    method: "GET",
    query: query,
    secure: true,
    format: "json",
    ...requestParams,
  });
