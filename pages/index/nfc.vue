<template>
	<view>
		<view class="uni-title uni-common-mt uni-common-pl">选择扇区：</view>
		<view class="uni-list">
			<view class="uni-list-cell">
				<view class="uni-list-cell-db">
					<picker @change="sectorChange" :value="sector" :range="sectorArray">
						<view class="uni-input">{{sectorArray[sector]}}</view>
					</picker>
				</view>
			</view>
		</view>
		<view class="uni-title uni-common-mt uni-common-pl">验证方式：</view>
		<view class="uni-list">
			<radio-group @change="radioChange">
				<label class="uni-list-cell uni-list-cell-pd" v-for="(item) in keyitems" :key="item.value">
					<view>
						<radio :value="item.value" :checked="item.value === keyType" />
					</view>
					<view>{{item.name}}</view>
				</label>
			</radio-group>
		</view>
		<view class="uni-title uni-common-mt uni-common-pl">扇区秘钥：</view>
		<view class="uni-list">
			<input class="uni-input" v-model="keyVal"/>
		</view>
		<view class="btn-row">
		    <button type="primary" class="primary" @tap="readcard">读取IC卡</button>
		</view>
		<view class="text">
		    IC卡UID：{{ICUID}}
		</view>
		<view class="textmline">
		    {{ICData}}
		</view>
		<view class="text">
		    {{ICERROR}}
		</view>
	</view>
</template>

<script>
	let Context = plus.android.importClass("android.content.Context");
	let NfcManager = plus.android.importClass("android.nfc.NfcManager");
	let NfcAdapter = plus.android.importClass("android.nfc.NfcAdapter");
	let Settings= plus.android.importClass("android.provider.Settings");
	let Intent = plus.android.importClass("android.content.Intent");
	let Parcelable = plus.android.importClass("android.os.Parcelable");
	let PendingIntent = plus.android.importClass('android.app.PendingIntent');
	let IntentFilter = plus.android.importClass('android.content.IntentFilter');
	let NdefRecord = plus.android.importClass("android.nfc.NdefRecord");
	let NdefMessage = plus.android.importClass("android.nfc.NdefMessage");
	let Tag = plus.android.importClass("android.nfc.Tag");
	let MifareClassic = plus.android.importClass("android.nfc.tech.MifareClassic");
	let invoke = plus.android.invoke;
	export default {
		data() {
			return {
				sectorArray:[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
				keyitems:[{value:'A',name:'KeyA'},{value:'B',name:'KeyB'}],
				sector:0,
				keyType:'A',
				keyVal:'FFFFFFFFFFFF',
				ICUID:'',
				ICData:'IC卡扇区数据：',
				ICERROR:'',
				nfcAdapter:null,
				main:null,
				intent:null,
				IntervalId:null,
				techListsArray:[
					["android.nfc.tech.IsoDep"],
					["android.nfc.tech.NfcA"],
					["android.nfc.tech.NfcB"],
					["android.nfc.tech.NfcF"],
					["android.nfc.tech.NfcV"],
					["android.nfc.tech.Ndef"],
					["android.nfc.tech.NdefFormatable"],
					["android.nfc.tech.MifareClassic"],
					["android.nfc.tech.MifareUltralight"]
                ]
			}
		},
		onLoad() {
			this.nfcinit();
		},
		onUnload() {
			this.nfcclose();
		},
		methods:{
			sectorChange:function(e){
				this.sector=e.target.value;
			},
			radioChange:function(evt){
				this.keyType=evt.target.value;
			},
			nfcinit:function(){
				this.main=plus.android.runtimeMainActivity();
				var nfchManager = this.main.getSystemService(Context.NFC_SERVICE);
				var nfcAdapter = nfchManager.getDefaultAdapter();
				if(!nfcAdapter.isEnabled()){
					this.intent= new Intent(Settings.ACTION_NFC_SETTINGS);
					this.main.startActivity(this.intent); 
				}
				var intent = new Intent(this.main, this.main.getClass());
                intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                var pendingIntent = PendingIntent.getActivity(this.main, 0, intent, 0);
				var ndef = new IntentFilter("android.nfc.action.TECH_DISCOVERED");
				ndef.addDataType("*/*");
				var intentFiltersArray = [ndef];
				nfcAdapter.enableForegroundDispatch(this.main, pendingIntent, intentFiltersArray, this.techListsArray);
				this.nfcAdapter=nfcAdapter;
				console.log('nfcAdapter', nfcAdapter)
			},
			nfcclose:function(){
				if(this.nfcAdapter)
					this.nfcAdapter.disableForegroundDispatch(this.main);
				this.nfcAdapter=null;
				clearInterval(this.IntervalId);
			},
			handle_nfc_data:function(){
				var intent = this.main.getIntent();
				if(intent.getAction()=="android.nfc.action.TECH_DISCOVERED"){
					clearInterval(this.IntervalId);
					this.readData(intent);
                }
			},
			readData:function(intent){
				var tag = intent.getParcelableExtra(NfcAdapter.EXTRA_TAG);
				var techList = tag.getTechList();
				var bisMfc=false;
				for(var i=0;i<techList.length;i++){
					if(techList[i].indexOf('MifareClassic')>=0){
						bisMfc=true;
						break;
					}
				}
				if(!bisMfc){
					this.ICERROR='卡片类型错误!';
					return;
				}
				var mfc=MifareClassic.get(tag);
				if(!mfc){
					this.ICERROR='卡片获取错误!';
					return;
				}
				mfc.setTimeout(3000);
				if(!mfc.isConnected()){
					try{
						invoke(mfc,'connect'); 
					}catch(e){
						this.ICERROR='卡片连接错误!';
						return;
					}
				}
				try{
					this.ICUID=this.ByteArrayToHexString(tag.getId());
					console.log('tag', tag, this.ICUID)
					var cmdBytes=this.HexStringToByteArray(this.keyVal);
					var auth=false;
					if(this.keyType=="A"){
						auth=invoke(mfc,"authenticateSectorWithKeyA",parseInt(this.sector),cmdBytes);
					}else{
						auth=invoke(mfc,"authenticateSectorWithKeyB",parseInt(this.sector),cmdBytes);
					}
					if(!auth){
						this.ICERROR='扇区验证失败';
						return;
					}
					var sectorData=[];
					var tmpRet;
					this.ICData='IC卡扇区数据>>';
					for(var i=0;i<4;i++){ 
						tmpRet=invoke(mfc,"readBlock",this.sector*4+i);
						this.ICData=this.ICData+'\n';
						this.ICData=this.ICData+this.ByteArrayToHexString(tmpRet);
						sectorData.push.apply(sectorData,tmpRet);
					}
					console.log(this.ByteArrayToHexString(sectorData));
					this.ICERROR='读卡完成';
				}catch(e){
					this.ICERROR=e.message;
					console.error(e); 
				}finally{
					mfc.close();
				}
			},
			readcard:function(){
				var that=this;
				this.ICUID='',
				this.ICData='',
				this.ICERROR='',
				this.IntervalId = setInterval(function(){
					that.handle_nfc_data();
				},1000);
			},
			ByteArrayToHexString:function(inarray) {
				var i, j, inn;
				var hex = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];
				var out = '';
				for(j = 0; j<inarray.length; ++j) { 
					inn = inarray[j] & 0xff;
					i = (inn >>> 4) & 0x0f;
					out += hex[i]; 
					i = inn & 0x0f;
					out += hex[i];
				}
				return out;
			},
			HexStringToByteArray:function(instr) {
				var hexA = new Array();
				var pos = 0;
				var len = instr.length/2;
				for(var i=0; i<len; i++)
				{
					var s = instr.substr(pos, 2);
					var v = parseInt(s, 16);
					if(v>=128)
						v=v-256;
					hexA.push(v);
					pos += 2;
				}
				return hexA;
			}
		}
	}
</script>

<style>
	.input-row {
	    display: flex;
	    flex-direction: row; 
	    position: relative;
		min-height: 80upx; 
	}
	.input-row .title {
        width: 40%;
        height: 50upx;
        min-height: 50upx;
        padding: 15upx 0;
        padding-left: 30upx;
        line-height: 80upx;
		font-size:30upx;
		text-align: right;
    }
	.input-row input {
	    width: 60%;
	    height: 80upx;
	    min-height: 80upx;
	    padding: 15upx 0;
	    padding-right: 30upx;
	    line-height: 80upx;
	}
	.text{
		margin:15upx 10upx;
		padding: 0 5upx;
		background-color: #ebebeb;
		height: 70upx;
		line-height: 70upx;
		text-align: left;
		color: #777;
		font-size: 26upx;
	}
	.textmline{
		margin:15upx 10upx;
		padding: 0 5upx;
		background-color: #ebebeb;
		height: 280upx;
		line-height: 50upx;
		text-align: left;
		color: #777;
		font-size: 26upx;
	}
</style>
