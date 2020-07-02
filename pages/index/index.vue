<template>
	<view class="layout">
		<view class="title">
			<view class="top">
				证件读取
			</view>
			<view class="bottom">
				Certificate reading
			</view>
		</view>
		
		<view class="content">
			<view class="user">
				<view class="user-img">
					<image :src="'data:image/png;base64,' + form.PERSON_PHOTO_BYTE" mode="aspectFit"></image>
				</view>
				<view class="first">
					<view class="name">
						{{form.PERSON_NAME || ''}}
					</view>
					<view class="type">
						{{form.CARD_TYPE_NAME || ''}}
					</view>
				</view>
				<view class="escort" v-if="form.ESCORT_NAME">
					<view class="escort_name">
						引领人: {{form.ESCORT_NAME || ''}}
					</view>
					<view class="escort_unit" v-if="form.ESCORT_UNIT_NAME" style="margin-left: 30rpx;">
						{{form.ESCORT_UNIT_NAME || ''}}
					</view>
				</view>
			</view>

			<view class="second">
				<view class="second-child">
					<view class="left">
						<view class="label">
							单位
						</view>
						<view class="value">
							{{form.AIRPORT_NAME || ''}}
						</view>
					</view>
					<view class="mid">
						<view class="label">
							部门
						</view>
						<view class="value">
							{{form.COMPANY_NAME || ''}}
						</view>
					</view>
					<view class="right">
						<view class="label">
							证件号
						</view>
						<view class="value">
							{{form.CARD_NO || ''}}
						</view>
					</view>
				</view>
				
				<!-- <view class="second-child">
					<view class="left">
						<view class="label">
						引领人姓名
						</view>
						<view class="value">
							{{form.ESCORT_NAME || ''}}
						</view>
					</view>
					<view class="mid">
						<view class="label">
							引领人单位
						</view>
						<view class="value">
							{{form.ESCORT_UNIT_NAME || ''}}
						</view>
					</view>
					<view class="right">
						
					</view>
				</view> -->
				
				<view class="last">
					<view class="label">
						有效期
					</view>
					<view class="value">
						{{formatTime(form.VALID_FROM)}}~{{formatTime(form.VALID_TO)}}
					</view>
				</view>
			</view>
			
			<view class="third">
				<view class="area-title">
					<image src="../../static/area.png"></image>
					<text>通行区域</text>
				</view>
				<view class="area">
					<view class="item" v-for="(i, index) in form.PersonCardAreas" :key="index">
						{{i['AREA_CODE']}}
					</view>
				</view>
			</view>
		</view>
		
		<view class="effect">
			<view class="effect-content">
				<view class="left">
					<image src="../../static/effective.png"></image>
				</view>
				<view class="right">
					<view class="top">
						证件有效性
					</view>
					<view class="bottom">
						证件{{form.CARD_STATUS_NAME || ''}}
					</view>
				</view>
			</view>
			
		</view>
		<tui-modal :show="modal" @click="handleClick" title="提示" content="当前有新版本,是否立即下载?"></tui-modal>
	</view>
</template>

<script>
	import tuiModal from "@/components/modal"
	import dayjs from '../../common/util/dayjs.min.js'
	import {getIdMsg} from '../../common/api/home.js'
	import {getVersion} from '../../common/api/getVersion.js'
	// import {guid} from '../../common/util/util.js'
	// 包路径
	const package_NdefRecord = 'android.nfc.NdefRecord';
	const package_NdefMessage = 'android.nfc.NdefMessage';
	const package_TECH_DISCOVERED = 'android.nfc.action.TECH_DISCOVERED';
	const package_Intent = 'android.content.Intent'; 
	const package_Activity = 'android.app.Activity'; 
	const package_PendingIntent = 'android.app.PendingIntent'; 
	const package_IntentFilter = 'android.content.IntentFilter'; 
	const package_NfcAdapter = 'android.nfc.NfcAdapter'; 
	const package_Ndef = 'android.nfc.tech.Ndef'; 
	const package_NdefFormatable = 'android.nfc.tech.NdefFormatable'; 
	const package_Parcelable = 'android.os.Parcelable'; 
	const package_String = 'java.lang.String'; 
	
	let NfcAdapter;
	let NdefRecord;
	let NdefMessage;
	let readyRead = false;
	let noNFC = false;
	const techListsArray = [
		['android.nfc.tech.IsoDep'],
		['android.nfc.tech.NfcA'],
		['android.nfc.tech.NfcB'],
		['android.nfc.tech.NfcF'],
		['android.nfc.tech.Nfcf'],
		['android.nfc.tech.NfcV'],
		['android.nfc.tech.NdefFormatable'],
		['android.nfc.tech.MifareClassi'],
		['android.nfc.tech.MifareUltralight']
	];
	export default {
		components:{tuiModal},
		data() {
			return {
				newCurrenVersion: '',
				modal: false,
				currenVersion: '0',
				form: {
					PERSON_NAME: '',
					CARD_NO: '',
					VALID_FROM: '',
					VALID_TO: '',
					AIRPORT_NAME: '',
					COMPANY_NAME: '',
					CARD_TYPE_NAME: '',
					CARD_STATUS_NAME: '',
					PERSON_PHOTO_BYTE: '',
					ESCORT_NAME: '',
					ESCORT_UNIT_NAME: '',
					PersonCardAreas: []
				},
				licenseNo: '',
				appForm: {
					hash: '',
					licenseNo: ''
				}
			};
		},
		created () {
			// #ifdef APP-PLUS
			this.appForm.hash = plus.device.uuid.split(',')[0]
			let that = this
				plus.runtime.getProperty(plus.runtime.appid,function(inf){
	      	that.currenVersion = inf.version
					that.check()
					console.log(JSON.stringify(inf))
	      })
			// #endif
		},
		mounted () {
			// console.log(guid())
			// #ifdef H5
			let licenseNo = this.$route.query.licenseNo
			let hash = this.$route.query.hash
			console.log(this.$route, this.$route.query)
			if (licenseNo && hash) {
				this.$loading()
				getIdMsg({licenseNo: licenseNo, hash: hash}).then(res => {
					console.log(res)
					if (res.data) {
						 uni.hideLoading()
						this.form = res.data
						// this.form.ESCORT_NAME ='陆尚荣'
						// this.form.ESCORT_UNIT_NAME = '设备管理科'
						uni.showToast({
							title: '获取数据成功',
							duration: 1000
						})
					} else {
						uni.showToast({
							title: res.message,
							icon: 'none',
							duration: 2000
						})
					}
				}).catch(() => {
						uni.hideLoading();
					})
			}
			// #endif
			// #ifdef APP-PLUS
			this.listenNFCStatus()
			// #endif
			
		},
		onShow () {
			
		},
		computed: {
		},
		methods: {
			handleClick (e) {
				let index = e.index
				if (index === 1) {
					uni.navigateTo({
						url: `/pages/index/update?newCurrenVersion=${this.newCurrenVersion}`
					})
					// console.log(`https://www.pgyer.com/apiv2/app/install?_api_key=${dataPara._api_key}&appKey=${dataPara.appKey}&buildPassword=${dataPara.buildPassword}`)
					// plus.runtime.openURL(`https://www.pgyer.com/apiv2/app/install?_api_key=${dataPara._api_key}&appKey=${dataPara.appKey}&buildPassword=${dataPara.buildPassword}`)
				} else {
					this.$message('您取消了更新')
				}
				this.modal = false
			},
			check () {
				let para = {
					_api_key: '85244a596b323908ea22e8a7d46ab1af',
					appKey: '45914eede2ea870766f623d641f495ab'
				}
				getVersion(para).then(res => {
					this.newCurrenVersion = res.data.buildVersion
					console.log(222, this.newCurrenVersion, this.currenVersion)
					if (this.newCurrenVersion !== this.currenVersion) {
						getApp().globalData.buildUpdateDescription = res.data.buildUpdateDescription
						this.modal = true
					}
				})
			},
			formatTime (time) {
				if (time) {
					return dayjs(time).format('YYYY-MM-DD')
				}
				return ''
			},
			listenNFCStatus () {
				console.log(1)
				let that = this;
				try {
					let main = plus.android.runtimeMainActivity();
					let Intent = plus.android.importClass('android.content.Intent');
					let Activity = plus.android.importClass('android.app.Activity');
					let PendingIntent = plus.android.importClass('android.app.PendingIntent');
					let IntentFilter = plus.android.importClass('android.content.IntentFilter');
					NfcAdapter = plus.android.importClass('android.nfc.NfcAdapter');
					let nfcAdapter = NfcAdapter.getDefaultAdapter(main);
					console.log('nfcAdapter', nfcAdapter)
					if(nfcAdapter == null){
						uni.showToast({
						  title: '设备不支持NFC！',
						  icon: 'none'
						})
						noNFC = true;
						return;
					}
					
					if (!nfcAdapter.isEnabled()) {
						console.log('请先开启')
						uni.showToast({
						  title: '请在系统设置中先启用NFC功能！然后重启app',
						  icon: 'none',
							duration: 5000
						});
						noNFC = true;
						return;
					}else{
						noNFC = false;
					}
					console.log('准备开始')
					let intent = new Intent(main, main.getClass());
					intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
					let pendingIntent = PendingIntent.getActivity(main, 0, intent, 0);
					let ndef = new IntentFilter("android.nfc.action.TECH_DISCOVERED");
					ndef.addDataType("*/*");
					let intentFiltersArray = [ndef];
					
					plus.globalEvent.addEventListener('newintent',function() {
						console.log('newintent running');
						// 轮询调用 NFC
						setTimeout(that.nfcRuning(), 1000);
					});
					plus.globalEvent.addEventListener('pause',function(e) {
						console.log('pause running');
						if (nfcAdapter) {
							//关闭前台调度系统
							//恢复默认状态
							nfcAdapter.disableForegroundDispatch(main);
						}
					});
					plus.globalEvent.addEventListener('resume',function(e) {
						console.log('resume running');
						if (nfcAdapter) {
							 //开启前台调度系统
							// 优于所有其他NFC
							nfcAdapter.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray);
						}
					});
					nfcAdapter.enableForegroundDispatch(main, pendingIntent, intentFiltersArray, techListsArray); 
				} catch (e) {
					console.error(e);
				}
			},
			nfcRuning () {
				NdefRecord = plus.android.importClass("android.nfc.NdefRecord");
				NdefMessage = plus.android.importClass("android.nfc.NdefMessage");
				let main = plus.android.runtimeMainActivity();
				let intent = main.getIntent();
				let that = this;
				
				console.log("action type:" + intent.getAction());
				
				if (package_TECH_DISCOVERED == intent.getAction()) {
					that.read(intent);
					readyRead = false;
				}
			},
			read(intent) {
				this.form = {}
				this.toast('请勿移开标签正在读取数据');
				
				// NFC id
				let bytesId = intent.getByteArrayExtra(NfcAdapter.EXTRA_ID);
				console.log('bytesId', bytesId)
				let uid = this.byteArrayToHexString(bytesId);
				console.log('licenseNo', uid)
				let transUid = ''
				if (uid && uid.length > 0) {
					for (let i = uid.length - 1; i >= 0; i--) {
						if (i % 2 === 0) {
							transUid = transUid + uid[i] + uid[i + 1]
						}
					}
					console.log('ttttt', parseInt(transUid, 16))
					let licenseNo = parseInt(transUid, 16)
					let that = this;
					that.appForm.licenseNo = licenseNo
					that.$loading()
					getIdMsg(that.appForm).then(res => {
						 uni.hideLoading();
						console.log(res)
						if (res.data) {
							uni.showToast({
								title: '获取数据成功',
								duration: 1000
							})
							that.form = res.data
						} else {
							uni.showToast({
								title: res.message,
								icon: 'none',
								duration: 2000
							})
						}
					}).catch(() => {
						uni.hideLoading();
					})
				} else {
					uni.showToast({
						title: '获取卡id错误',
						icon: 'none'
					})
				}
				
				
				
			},
			byteArrayToHexString: function (inarray) { // converts byte arrays to string
					let i, j, inn;  
					let hex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];  
					let out = "";  
					
					for(j = 0; j < inarray.length; ++j) {
						inn = inarray[j] & 0xff;  
						i = (inn >>> 4) & 0x0f;  
						out += hex[i];  
						i = inn & 0x0f;  
						
						out += hex[i];  
					}  
					return out;  
				},
				toast (content){
					uni.showToast({
						title: content,
						icon: 'none'
					})
				}
			}
			
		
	}
</script>

<style lang="scss">
	.layout {
		height: 100vh;
		background-size:100% 100%;
		background-repeat:no-repeat;
		padding: 8vh 3vw 5vh 3vw;
		background-image: url(../../static/bg.png);
		width: 100vw;
		.content {
			width: 100%;
			height: 59vh;
			background-color: #ffffff;
			border-radius: 16rpx;
			padding: 0 7vw;
			.third {
				.area {
					margin-top: 30rpx;
					display: grid;
					grid-template-columns: 30% 30% 30%;
					grid-row-gap: 10px;
					grid-column-gap: 20px;
					.item {
						height: 56rpx;
						line-height: 56rpx;
						/* #ifdef APP-PLUS */
						line-height: 60rpx;
						/* #endif */
						background-color: #dee2fd;
						border-radius: 26rpx;
						padding: 0rpx 30rpx;
						font-size: 31rpx;
						letter-spacing: 1rpx;
						color: #114094;
						text-align: center;
					}
				}
				.area-title {
					margin-top: 20rpx;
					image {
						width: 35rpx;
						height: 42rpx;
						display: inline-block;
						position: relative;
						top: 5rpx;
					}
					text {
						font-size: 31rpx;
						font-weight: bold;
						letter-spacing: 1rpx;
						color: #2674fd;
						margin-left: 15rpx;
					}
				}
			}
			.second {
				height: 30%;
				.second-child {
					margin-top: 20rpx;
					display: flex;
					justify-content: space-between;
					.left {
						width: 33%;
					}
					.mid {
						text-align: center;
						width: 33%;
					}
					.right {
						text-align: right;
						width: 33%;
					}
				}
				.last {
					margin-top: 20rpx;
				}
				.label {
					font-size: 27rpx;
					letter-spacing: 1rpx;
					color: #8c8c8c;
					line-height: 65rpx;
				}
				.value {
					font-size: 31rpx;
					letter-spacing: 1rpx;
					color: #262626;
				}
			}
			.user {
				height: 30%;
				.escort {
					display: flex;
					justify-content: flex-start;
					margin-top: 15rpx;
					.escort_name, .escort_unit {
						height: 42rpx;
						background-color: #dff8d5;
						border-radius: 21rpx;
						font-size: 27rpx;
						line-height: 42rpx;
						letter-spacing: 1rpx;
						color: #389e0d;
						padding: 0 20rpx;
					}
				}
				.first {
					display: flex;
					justify-content: space-between;
					margin-top: -60rpx;
					.name {
						transform:skewX(-10deg);
						font-size: 42rpx;
						font-weight: bold;
						letter-spacing: 1rpx;
						color: #0a70ee;
					}
					.type {
						height: 50rpx;
						line-height: 50rpx;
						/* #ifdef APP-PLUS */
						line-height: 55rpx;
						/* #endif */
						background-color: #389e0d;
						border-radius: 21rpx;
						padding: 0rpx 20rpx;
						font-size: 31rpx;
						letter-spacing: 1rpx;
						color: #ffffff;
					}
				}
			}
			.user-img {
				width: 15vh;
				height: 15vh;
				border-radius: 100%;
				background-color: #FFFFFF;
				position: relative;
				left: 50%;
				// top: -50%;
				transform: translate(-50%, -50%);
				padding: 6rpx;
				image {
					height: 100%;
					width: 100%;
					border-radius: 100%;
				}
			}
		}
		.effect {
			height: 10vh;
			width: 100%;
			background-image: linear-gradient(-90deg, 
				#9ca5ff 0%, 
				#4c9bfd 100%);
			border-radius: 16rpx;
			margin-top: 3vh;
			
			padding: 0 28rpx;
			.effect-content {
				display: flex;
				justify-content: flex-start;
				position: relative;
				top: 50%;
				transform: translateY(-50%);
			}
			.left {
				image {
					width: 85rpx;
					height: 85rpx;
				}
			}
			.right {
				margin-left: 30rpx;
				.top {
					font-size: 27rpx;
					letter-spacing: 1rpx;
					color: #fefefe;
					opacity: 0.6;
					line-height: 40rpx;
				}
				.bottom {
					font-size: 31rpx;
					letter-spacing: 1rpx;
					color: #fefefe;
					font-weight: bold;
				}
			}
		}
		.title {
			height: 8vh;
			margin-bottom: 9vh;
			.top {
				font-size: 50rpx;
				font-weight: bold;
				color: #ffffff;
			}
			.bottom {
				font-size: 31rpx;
				letter-spacing: 1rpx;
				color: #ffffff;
				opacity: 0.6;
			}
		}
	}
</style>
