/* 
 *  名称: 本地字典
 *  功能: 数据字典
 *  其他: 提供dicReplace方法，用于替换字符
 */

export const DIC = {
  // 支付状态
  payStatus: [{
    value: 0,
    label: '待支付'
  }, {
    value: 1,
    label: '支付成功'
  }, {
    value: 2,
    label: '支付失败'
  }, {
    value: 3,
    label: '已退款'
  }],
  // 订单状态
  orderStatus: [{
    value: 0,
    label: '待提交'
  }, {
    value: 1,
    label: '待支付'
  }, {
    value: 2,
    label: '待出票'
  }, {
    value: 3,
    label: '已出票'
  }, {
    value: 4,
    label: '已取消'
  }, {
    value: 5,
    label: '已退票'
  }],
  // 用户等级
  userRank: [{
    value: 0,
    label: '点石之交'
  }, {
    value: 1,
    label: '金石之交'
  }, {
    value: 2,
    label: '君子之交'
  }, {
    value: 3,
    label: '莫逆之交'
  }],
  // 票类型
  ticketType: [{
    value: '1',
    label: '全票'
  }, {
    value: '2',
    label: '半票'
  }, {
    value: '3',
    label: '协童票'
  }]
}
export const dicReplace = (dicName, value) => {
  if (dicName && value!=null) {
    return DIC[dicName].find(item => item.value == value).label
  }
  return null
}
