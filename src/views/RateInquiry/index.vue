<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
        <!-- 左侧卡片：收款费率 -->
        <div class="rate-card rate-card-receive">
          <div class="card-header">
            <span>PIX - 收款费率</span>
            <button class="btn-add">+</button>
          </div>
          <div class="card-body">
            <div class="rate-item">
              <span class="label">百分比:</span>
              <span class="value">{{ receiveRate.percent }} %</span>
            </div>
            <div class="rate-item">
              <span class="label">固定费率:</span>
              <span class="value">R$ {{ receiveRate.fixed }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧卡片：付款费率 -->
        <div class="rate-card rate-card-pay">
          <div class="card-header">
            <span>PIX - 付款费率</span>
            <button class="btn-minus">-</button>
          </div>
          <div class="card-body">
            <div class="rate-item">
              <span class="label">百分比:</span>
              <span class="value">{{ payRate.percent }} %</span>
            </div>
            <div class="rate-item">
              <span class="label">固定费率:</span>
              <span class="value">R$ {{ payRate.fixed }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import useUserStore from "@/stores/user";
import { http } from "@/api";

const props = defineProps({
  title: {
    type: String,
    default: "商户费率",
  },
});

// 模拟费率数据（可从接口获取）
const receiveRate = ref({
  percent: "0.50",
  fixed: "0"
});

const payRate = ref({
  percent: "0.00",
  fixed: "0"
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
  min-height: 100%;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    margin: 0px;
    height: 0px;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  padding: 0 $spacing-xl;
  border-radius: $border-radius-md;
  display: flex;
  gap: 16px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}
.rate-card {
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  margin: 0 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &-receive {
    border: 1px solid #e6f7e6;
  }

  &-pay {
    border: 1px solid #fde6e6;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #333;
}

.btn-add {
  background-color: #4CAF50;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
}

.btn-minus {
  background-color: #f44336;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rate-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;

  .label {
    font-weight: 500;
  }

  .value {
    font-weight: 600;
    color: #333;
  }
}
</style>
