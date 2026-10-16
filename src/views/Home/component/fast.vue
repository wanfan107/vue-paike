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
                <el-icon class="fast-icon" :size="20">
                  <component :is="item.elIcon"></component>
                </el-icon>
              </div>
              <div class="fast-text">{{ t(item.labelKey) }}</div>
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Wallet, WalletFilled, CreditCard, InfoFilled, Download } from '@element-plus/icons-vue'
import useUserStore from '@/stores/user'

const userStore = useUserStore()
const router = useRouter()
const { t } = useI18n()

const baseItems = ref([
  {
    name: 'withdraw',
    path: '/withdraw',
    elIcon: 'Postcard',
    labelKey: 'menu.withdraw',
  },
  {
    name: 'ReceiptOrder',
    path: '/ReceiptOrder',
    elIcon: 'WalletFilled',
    labelKey: 'menu.ReceiptOrder',
  },
  {
    name: 'payment',
    path: '/payment',
    elIcon: 'CreditCard',
    labelKey: 'menu.payment',
  },
  {
    name: 'info',
    path: '/account/info',
    elIcon: 'InfoFilled',
    labelKey: 'menu.info',
  },
])

const exportRecordItem = {
  name: 'exportRecord',
  path: '/ExportRecord',
  elIcon: 'Download',
  labelKey: 'menu.exportRecord',
}

const fastItems = computed(() => {
  return [...baseItems.value, exportRecordItem]
})

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
  margin-top: 12px;
}

.fast-card-wrapper {
  cursor: pointer;
  transition: all 0.25s ease;
}

.fast-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background-color: var(--color-surface, #ffffff);
  border-radius: 16px;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08));
  border: 1px solid var(--color-border-soft, #f0f1f3);
  transition: all 0.25s ease;
  margin-bottom: 12px;
}

.fast-card:hover {
  border-color: var(--brand-primary-glow, rgba(22, 163, 74, 0.3));
  box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.1));
  transform: translateY(-2px);
}

.fast-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.fast-icon-wrapper {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background-color: var(--brand-primary-soft, rgba(22, 163, 74, 0.1));
  color: var(--brand-primary, #16a34a);
  transition: all 0.25s ease;
  flex-shrink: 0;
}

.fast-card:hover .fast-icon-wrapper {
  background-color: var(--brand-primary, #16a34a);
  color: var(--text-inverse, #ffffff);
}

.fast-text {
  margin: 0;
  font-size: 14px;
  color: var(--text-regular, #374151);
  font-weight: 500;
}
</style>