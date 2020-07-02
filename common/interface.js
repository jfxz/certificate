import _config from './apiConfig'; // 导入私有配置

export default function $http(options) {
	if (options.pgyer) {
		options.url = _config.pgyerUrl + options.url
	} else {
		options.url = _config.url + options.url
	}
	// options.url = _config.url + options.url;
	// _config.header['Authorization'] = uni.getStorageSync('access_token')
  return new Promise((resolve, reject) => {
		// 进行url字符串拼接
    // 拦截请求
    _config.complete = (response) => {
      //  request請求访问成功
      if (response.statusCode === 200) {
          // 接口请求成功
          resolve(response.data);
      } else {
        // 处理catch 请求，不在本页面之外处理，统一在这里处理
				if(options.handle){
					reject(response)
				}else{
					try {
					  Promise.reject(response).catch(err => {
					    _page_error(response.statusCode || response.errMsg, response);
							reject(response)
					  });
					} catch (e) {
						uni.hideLoading()
					  console.log(e)
					}
				}
      }

    }
    // 开始请求
    uni.request(Object.assign({},_config, options));
  })
}

// 接口錯誤
function _error(err, msg = '') {
}
// request 錯誤
function _page_error(err, response) {
  switch (err) {
		case 403:
		  break;
		case 400: 
			break;
		case 401:
		  break;
    case 404:
      // 错误码404的处理方式
			uni.showToast({
				title: '没有找到页面',
				duration: 1000,
				icon:'none'
			})
      console.error("没有找到页面")
      break;
    case 405:
			uni.showToast({
				title: '错误的请求',
				duration: 1000,
				icon:'none'
			})
      console.error("错误的请求")
      break;
  }
}