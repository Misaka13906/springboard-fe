<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");

  // Check for access token
  try {
    const accessToken = uni.getStorageSync('access_token');
    if (!accessToken) {
      console.log('No access token found, redirecting to login.');
      // Redirect to login page if no token
      uni.reLaunch({
        url: '/pages/profile/login' // Ensure this path is correct
      });
    } else {
      console.log('Access token found, proceeding normally.');
      // Optional: Verify token validity here with a lightweight API call if needed
    }
  } catch (e) {
    console.error('Error checking auth status on launch:', e);
    // Fallback: Redirect to login on error
    uni.reLaunch({
      url: '/pages/profile/login'
    });
  }
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style></style>
