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
  SimpleOrdersCancelParams,
} from "../data-contracts";
import type { ApiRequestClient, RequestParams } from "../http-client";

/**
 * No description
 *
 * @tags Orders
 * @name SimpleOrdersCancel
 * @summary Cancel an order if its state permits the transition
 * @request POST:/api/v1/orders/{id}/cancel
 * @secure
 */
export const simpleOrdersCancel = (
  http: ApiRequestClient,
  { id, ...query }: SimpleOrdersCancelParams,
  requestParams: RequestParams = {},
) =>
  http.request<OrderResponseDto, ErrorResponseDto>({
    path: `/api/v1/orders/${id}/cancel`,
    method: "POST",
    secure: true,
    format: "json",
    ...requestParams,
  });
