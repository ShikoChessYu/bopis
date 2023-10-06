import { api, client, hasError } from '@/adapter';
import emitter from '@/event-bus';
import { translate } from '@/i18n';
import store from '@/store';
import { showToast } from '@/utils';

const getOpenOrders = async (payload: any): Promise <any> => {
  return api({
    url: "solr-query",
    method: "post",
    data: payload
  });
}

const getOrderDetails = async (payload: any): Promise <any> => {
  return api({
    url: "solr-query",
    method: "post",
    data: payload
  });
}

const getCustomerContactDetails = async (orderId: any): Promise <any>  => {
  return api({
    url: `orders/${orderId}`,
    method: "get",
    cache: true
  });
}

const getPackedOrders = async (payload: any): Promise <any> => {
  return api({
    url: "solr-query",
    method: "post",
    data: payload
  });
}

const getCompletedOrders = async (payload: any): Promise <any> => {
  return api({
    url: "solr-query",
    method: "post",
    data: payload
  });
}

const updateShipment = async (payload: any): Promise <any> => {
  return api({
    url: "updateShipment",
    method: "post",
    data: payload
  });
}

const quickShipEntireShipGroup = async (payload: any): Promise <any> => {
  return api({
    url: "quickShipEntireShipGroup",
    method: "post",
    data: payload
  });
}

const rejectItem = async (payload: any): Promise<any> => {
  try {
    emitter.emit("presentLoader");
    const params = {
      'orderId': payload.orderId,
      'rejectReason': payload.item.reason,
      'facilityId': payload.item.facilityId,
      'orderItemSeqId': payload.item.orderItemSeqId,
      'shipmentMethodTypeId': payload.shipmentMethodEnumId,
      'quantity': parseInt(payload.item.quantity),
      ...(payload.shipmentMethodEnumId === "STOREPICKUP" && ({ "naFacilityId": "PICKUP_REJECTED" })),
    }

    const resp = await api({
      url: "rejectOrderItem",
      method: "post",
      data: { 'payload': params }
    });

    if (!hasError(resp)) {
      showToast(translate('Item has been rejected successfully'));
    } else {
      showToast(translate('Something went wrong'));
    }
    return resp;
  } catch (error) {
    console.error(error);
  } finally {
    emitter.emit("dismissLoader");
  }
}

const rejectOrderItem = async (payload: any): Promise <any> => {
  return api({
    url: "rejectOrderItem",
    method: "post",
    data: payload
  });
}

const createPicklist = async (query: any): Promise <any> => {
  let baseURL = store.getters['user/getInstanceUrl'];
  baseURL = baseURL && baseURL.startsWith('http') ? baseURL : `https://${baseURL}.hotwax.io/api/`;
  return client({
    url: 'createPicklist',
    method: 'POST',
    data: query,
    baseURL,
    headers: { "Content-Type": "multipart/form-data" },
  })
}

const sendPickupScheduledNotification = async (payload: any): Promise <any> => {
  return api({
    url: "service/sendPickupScheduledNotification",
    method: "post",
    data: payload
  });
}

const getShipToStoreOrders = async (query: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: query
  })
}

const getShipmentItems = async (shipmentIds: any): Promise<any> => {
  if (!shipmentIds.length) return []
  const requests = []

  const shipmentIdList = shipmentIds
  while (shipmentIdList.length) {
    const batch = shipmentIdList.splice(0, 20)
    const params = {
      inputFields: {
        shipmentId: batch
      },
      viewSize: 250, // maximum view size
      entityName: 'ShipmentItem',
      noConditionFind: "Y",
      fieldList: ['shipmentId', 'productId', 'shipmentItemSeqId']
    }
    requests.push(params)
  }

  const shipmentItemsResps = await Promise.all(requests.map((params) => api({
    url: 'performFind',
    method: 'POST',
    data: params
  })))

  const hasFailedResponse = shipmentItemsResps.some((response: any) => hasError(response) && response.data.error !== "No record found")

  if (hasFailedResponse) return Promise.reject(shipmentItemsResps);

  return shipmentItemsResps.reduce((responseData: any, response: any) => {
    if (!hasError(response)) responseData.push(...response.data.docs)
    return responseData
  }, [])
}

const getOrderItemRejHistory = async (payload: any): Promise<any> => {
  return api({
    url: 'performFind',
    method: 'POST',
    data: payload
  })
}

export const OrderService = {
  getOpenOrders,
  getOrderDetails,
  getCompletedOrders,
  getPackedOrders,
  getOrderItemRejHistory,
  quickShipEntireShipGroup,
  rejectItem,
  rejectOrderItem,
  updateShipment,
  createPicklist,
  sendPickupScheduledNotification,
  getShipToStoreOrders,
  getShipmentItems,
  getCustomerContactDetails
}