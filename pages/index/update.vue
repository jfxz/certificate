<template>
  <view class="flex-column">
    <view class="content">
      <image class="logo" src="../../static/logo.png" mode="aspectFit"/>
      <view class="mainInfo">
        <text class="title">{{ info }} &nbsp V {{ Minfo }}</text>
        <text class="tip">\n{{ Mtip }}</text>
      </view>
      <text class="line"/>
    </view>
    <view>
      <view class="infoContentTitle">
        <image class="infoPic" src="../../static/info-circle2.png"/>
        <text class="infoTitle">更新摘要</text>
      </view>
      <view class="infoContent">
        <text class="updateInfo">{{ updateInfo }}</text>
      </view>
    </view>
    <view v-if="!currentIsLatest">
      <view class="infoContentTitle">
        <image class="infoPic" src="../../static/sync.png"/>
        <text class="infoTitle">更新大小</text>
      </view>
      <view class="infoContent">
        <text class="updateInfo">{{ packgeSize }}</text>
      </view>
    </view>
    <view class="minorContent bottom_aera">
      <view v-if="startProgress" class="smallTitle">
        <text >下载进度:{{ downloadProgress }}%</text>
        <progress :percent="downloadProgress" stroke-width="4" />
      </view>
      <button v-if="!startProgress" type="primary" @tap="handleUpdate">立即更新</button>
      <!-- <button v-if="currentIsLatest" :loading="buttonLoading" type="primary" @click="getLatest()">检查更新</button> -->
    </view>
  </view>
</template>

<script>
export default {
  components: {

  },
  data() {
    return {
			newCurrenVersion: '',
      info: '正在加载', // 主标题显示版本号
      Minfo: '未知', // 副标题显示版本类型
      Mtip: '', // 小提示标语
      updateInfo: '无', // 更新摘要

      latest: null, // 版本信息
      packgeSize: null, // 更新包大小
      packgePath: null, // 更新包的文件地址
      downloadTask: null, // 下载任务
      downloadProgress: 0, // 下载进度

      buttonLoading: false, // 加载 - 标记
      installed: false, // 是否执行了安装 - 标记
      startProgress: false, // 下载进行 - 标记
      currentIsLatest: true // 当前版本就是最新版本 - 标记
    }
  },
  onReady() {
    this.getLatest()
    const updated = uni.getStorageSync('updated')
    if (updated.packgePath) {
      this.packgePath = updated.packgePath
    }
  },
	onLoad (options) {
		console.log(options)
		this.newCurrenVersion = options.newCurrenVersion
	},
  // 如果用户下载后没有完成安装，却回到app，则执行这里
  onShow() {
    if (this.installed === true && this.packgePath) {
      this.installed = false
      // this.haveDownloaded()
    }
  },
  // 用户关闭页面时检查是否存在下载任务
  onUnload() {
      if (this.downloadTask) {
        this.closeTask()
        this.showToast('更新被取消')
      }
  },
  // 下拉刷新更新
 /* onPullDownRefresh() {
    this.getLatest()
    uni.stopPullDownRefresh()
  }, */
  methods: {
    // 封装个Toast方便用
    showToast(text) {
      uni.showToast({
        title: text,
        duration: 3000,
        icon: 'none'
      })
    },
    installPackge() {
      // 安装更新
      plus.runtime.install(this.packgePath, { force: true })
      this.installed = true
      // 保存更新记录到stroage，方便下次启动app时删除安装包
      uni.setStorage({
        key: 'updated',
        data: {
          completed: true,
          packgePath: this.packgePath
        },
        success: (res) => {
          console.log('成功保存更新记录')
        }
      })
      // 判断是否为热更新（判断文件名中是否含有.wgt）
      if (this.packgePath.match(RegExp(/.wgt/)) || this.packgePath.match(RegExp(/.apk/))) {
        this.installed = false
        uni.showModal({
          title: '提示',
          content: '应用将重启以完成更新',
          showCancel: false,
          complete: () => {
            plus.runtime.restart()
          }
        })
      }
    },
    // 已经下载了更新包但是没有安装
    // haveDownloaded() {
    //   uni.showModal({
    //       title: '更新尚未完成',
    //       content: '您已下载更新包，但是还没有完成安装，请问是否要继续安装更新包呢？',
    //       success: (res) => {
    //           if (res.confirm) {
    //             // 安装
    //             this.installPackge()
    //           } else if (res.cancel) {
    //             this.showToast('更新被取消')
    //           }
    //       }
    //   })
    // },
    // 取得最新版本及其所有信息
    getLatest() {
      this.info = '盐城证件读取' // 主标题显示版本号
      this.Minfo = this.newCurrenVersion	// 副标题显示版本类型
      this.updateInfo = getApp().globalData.buildUpdateDescription // 更新摘要
    },
    // 关闭下载任务
    closeTask() {
      this.downloadTask.abort()
      this.downloadTask = null
      this.startProgress = false
    },
    // 开始下载任务
    createTask(downloadLink) {
      //判断是否已经存在任务
			console.log('start')
        this.downloadProgress = 0
        this.startProgress = true
        // 创建下载任务对象
        this.downloadTask = uni.downloadFile({
          url: downloadLink,
          success: (res) => {
            if (res.statusCode === 200) {
              // 保存下载的安装包
              uni.saveFile({
                tempFilePath: res.tempFilePath,
                success: (res) => {
                  this.packgePath = res.savedFilePath
                  // 进行安装
                  this.installPackge()
                  // 任务完成，关闭下载任务
                  this.closeTask()
                },
								fail: (err) => {
									console.log('err', err)
								}
              })
            }
          }
        })
        // 进度条更新
        this.downloadTask.onProgressUpdate((res) => {
          this.downloadProgress = res.progress
        })        
      
    },
    handleUpdate() {
			let dataPara = {
				_api_key: '85244a596b323908ea22e8a7d46ab1af',
				appKey: '45914eede2ea870766f623d641f495ab',
				buildPassword: '123'
			}
			console.log('beforestart')
			let url = `http://www.pgyer.com/apiv2/app/install?_api_key=${dataPara._api_key}&appKey=${dataPara.appKey}&buildPassword=${dataPara.buildPassword}`
			// let url = 'http://3g.163.com/links/4636'
			this.createTask(url)
      
    }
  }
}
</script>

<style>
	.flex-column {
		display: flex;
		flex-direction: column;
		margin-top: 50rpx;
	}
	.content {
		text-align: center;
	}
	.minorContent {
		width:100%;
		padding:0 50upx;
	}
  .process {
    margin-top: 200upx;
		margin-left: 30%;
	}
	.logo {
    height: 300upx;
    width: 300upx;
  }
	.title {
		font-size: 36upx;
		color: #373737;
		font-weight: bold;
	}
	.infoTitle {
		font-size: 32upx;
		color: #373737;
		padding-left: 15upx;
		font-weight: bold;
	}
	.tip {
		font-size: 28upx;
		color: #7E7E83;
		vertical-align:text-top;
	}
	.bottom_aera {
		position: absolute;
		bottom: 0;
		height: 12%;
	}
	.line {
		padding: 0 600upx;
		border-bottom: 2upx solid #D8D8D8;
	}
	.infoPic {
    height: 50upx;
		width: 50upx;
	}
	.infoContentTitle {
		display: flex;
		align-items: center;
		padding: 40upx 40upx;
	}
	.infoContent {
		display: flex;
		align-items: center;
	}
	.updateInfo {
		font-size: 28upx;
		color: #7E7E83;
		padding: 0 80upx;
  }
  .smallTitle {
    font-size:26upx;
    font-weight:500;
    padding:20upx 0;
    line-height:1.5;
    color:#888;
  }
</style>
