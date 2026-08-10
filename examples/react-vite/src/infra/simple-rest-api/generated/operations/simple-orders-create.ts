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
  CreateOrderDto,
  ErrorResponseDto,
  OrderResponseDto,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";
import { ContentType } from "../http-client";

/**
 * No description
 *
 * @tags Orders
 * @name SimpleOrdersCreate
 * @summary Create an order and validate product stock
 * @request POST:/api/v1/orders
 * @secure
 */
export const simpleOrdersCreate = (
  http: ApiRequestClient,
  data: CreateOrderDto,
  requestParams: RequestParams = {},
) =>
  http.request<OrderResponseDto, ErrorResponseDto>({
    path: `/api/v1/orders`,
    method: "POST",
    body: data,
    secure: true,
    type: ContentType.Json,
    format: "json",
    ...requestParams,
  });
