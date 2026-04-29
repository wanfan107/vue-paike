<template>
  <div class="fast-container">
    <el-row :gutter="24">
      <el-col 
        :xs="12" 
        :sm="12" 
        :md="6" 
        :lg="6" 
        :xl="6" 
        v-for="(item, index) in fastItems" 
        :key="index"
      >
        <div class="fast-card-wrapper" @click="routerJump(item.path)">
          <el-card shadow="hover" class="fast-card">
            <div class="fast-card-content">
              <div class="fast-icon-wrapper">
                <el-icon color="#db0011" class="fast-icon" :size="20">
                  <component :is="item.elIcon"></component>
                </el-icon>
              </div>
              <div class="fast-text">{{ item.text }}</div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Wallet, WalletFilled, CreditCard, InfoFilled, Download } from '@element-plus/icons-vue'


// 获取路由实例
const router = useRouter()

// 定义快速访问项数据
const fastItems = ref([
  { 
    name: 'withdraw', 
    path: '/withdraw', 
    elIcon: 'Postcard', 
    text: '下发订单', 
  },
  { 
    name: 'ReceiptOrder', 
    path: '/ReceiptOrder', 
    elIcon: 'WalletFilled', 
    text: '收款订单', 
  },
  { 
    name: 'payment', 
    path: '/payment', 
    elIcon: 'CreditCard', 
    text: '付款订单', 
  },
  { 
    name: 'info', 
    path: '/account/info', 
    elIcon: 'InfoFilled', 
    text: '基本信息', 
  },
  // { 
  //   name: 'config', 
  //   path: '/account/config', 
  //   elIcon: 'Setting', 
  //   text: '应用配置', 
  // },
  { 
    name: 'exportRecord', 
    path: '/ExportRecord', 
    elIcon: 'Download', 
    text: '导出记录', 
  }
])

// 路由跳转方法
const routerJump = (path) => {
  console.log("path", path)
  router.push(path)
}
</script>

<script>
// 兼容 Options API 的写法（可选）
export default {
  name: "FastBox"
}
</script>

<style scoped>
.fast-container {
  width: 100%;
  padding: 0 5px;
  /* display: flex; */
  /* gap: 16px; */
  /* flex-wrap: wrap; */
  margin-top: 15px;
}

.fast-card-wrapper {
  flex: 1;
  min-width: 180px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fast-card {
  display: flex;
  /* align-items: center; */
  justify-content: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #333;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-height: auto;
  margin-bottom: 12px;
}

.fast-card:hover {
  background-color: #f5f7fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.fast-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px; /* 小圆角 */
  background-color: #f5f7fa; /* 浅灰色背景 */
  transition: all 0.3s ease;
}

.fast-card-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fast-icon-wrapper {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: #f5f7fa;
  margin-right: 8px;
    transition: all 0.3s ease;
}


.fast-text {
  margin: 0;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
</style>