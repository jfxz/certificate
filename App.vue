<script>
	export default {
		onLaunch: function () {
			console.log('App Launch')
		},
		onShow: function () {
			console.log('App Show')
		},
		onHide: function () {
			console.log('App Hide')
		}
	}
</script>

<style>
	@import "components/colorui/main.css";
	@import "components/colorui/icon.css";
	/*每个页面公共css */
	@import "./common/uni.css";
	@import "./common/common.css";
	@import "./components/colorui/main.css";
  @import "./components/colorui/icon.css";
</style>
