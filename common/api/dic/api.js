import https from '@/common/interface.js'
// 获取异常类型
export const getAbnType = (data) => {
    return https({
        url: '/abntype/all',
        method: 'GET',
				data
		// handle:true
    })
}
// 库位信息
export const getWarehouseValue = (data) => {
    return https({
        url: '/warehouseLocation/all',
        method: 'GET',
				data
		// handle:true
    })
}
// 查询
export const getFlightStatus = (data) => {
    return https({
        url: '/type/flightStatusType',
        method: 'GET',
				data
		// handle:true
    })
}
export const getUldType = (data) => {
    return https({
        url: '/type/uldType',
        method: 'GET',
				data
		// handle:true
    })
}
