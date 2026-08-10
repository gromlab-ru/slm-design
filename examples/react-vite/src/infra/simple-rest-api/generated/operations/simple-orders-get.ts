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
  OrderResponseDto,
  SimpleOrdersGetParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Orders
 * @name SimpleOrdersGet
 * @summary Get one visible order
 * @request GET:/api/v1/orders/{id}
 * @secure
 */
export const simpleOrdersGet = (
  http: ApiRequestClient,
  { id, ...query }: SimpleOrdersGetParams,
  requestParams: RequestParams = {},
) =>
  http.request<OrderResponseDto, ErrorResponseDto>({
    path: `/api/v1/orders/${id}`,
    method: "GET",
    secure: true,
    format: "json",
    ...requestParams,
  });
