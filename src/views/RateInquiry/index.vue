<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
      <el-skeleton v-if="loading" :rows="10" animated />
      <div v-else-if="!projectList.products || projectList.products.length === 0">暂无费率信息</div>
      <template v-else>
        <div class="app-panel">
          <div v-for="(item, index) in projectList.products" :key="index" class="product-row">
            <div class="rate-card rate-card-receive">
              <div class="card-header">
                <span>{{ item.productName }} - 收款费率</span>
                <button class="btn-add">+</button>
              </div>
              <div class="card-body">
                <div class="rate-item">
                  <span class="label">百分比:</span>
                  <span class="value">{{ item.productRate }}</span>
                </div>
                <div class="rate-item">
                  <span class="label">固定费率:</span>
                  <span class="value">{{ getCurrencySymbol(projectList.currency) }} {{ item.minFee || '0' }}</span>
                </div>
              </div>
            </div>

            <div class="rate-card rate-card-pay">
              <div class="card-header">
                <span>{{ item.productName }} - 付款费率</span>
                <button class="btn-minus">-</button>
              </div>
              <div class="card-body">
                <div class="rate-item">
                  <span class="label">百分比:</span>
                  <span class="value">{{ item.settlementFee1 }}</span>
                </div>
                <div class="rate-item">
                  <span class="label">固定费率:</span>
                  <span class="value">{{ getCurrencySymbol(projectList.currency) }} {{ item.settlementFee2 || '0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import useUserStore from "@/stores/user";
import { http } from "@/api";

const props = defineProps({
  title: {
    type: String,
    default: "商户费率",
  },
});

const userStore = useUserStore();

const projectList = ref({});
const loading = ref(true);

const formatRate = (rate) => {
  if (!rate || isNaN(parseFloat(rate))) {
    return "0.00%";
  }
  return `${(parseFloat(rate) * 100).toFixed(2)} %`;
};

const formatPercentageString = (percentageStr) => {
  if (!percentageStr || typeof percentageStr !== "string") {
    return "0.00";
  }
  const numStr = percentageStr.replace("%", "");
  const num = parseFloat(numStr);
  if (isNaN(num)) {
    return "0.00";
  }
  return num.toFixed(2) + " %";
};

const getCurrencySymbol = (currency) => {
  try {
    const formatter = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return formatter.format(0).replace(/[\d\s.,]/g, "");
  } catch (e) {
    return currency;
  }
};

const fetchMerchantInfo = async () => {
  try {
    const res = await http.merchant({
      id: userStore.merchantInfo.id,
    });
    if (res.code === 200) {
      projectList.value = res.data;
      if (projectList.value.products) {
        projectList.value.products.forEach((item) => {
          item.productRate = formatRate(item.productRate);
          if (projectList.value.settlementFee) {
            const parts = projectList.value.settlementFee.split(" + ");
            item.settlementFee1 = formatPercentageString(parts[0]);
            item.settlementFee2 = parts[1];
          }
        });
      }
      loading.value = false;
    } else {
      loading.value = false;
    }
  } catch (error) {
    loading.value = false;
    console.error("获取费率信息失败:", error);
  }
};

onMounted(() => {
  fetchMerchantInfo();
});
</script>

<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

.product-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.rate-card {
  background-color: var(--color-surface, white);
  border-radius: 12px;
  padding: 16px;
  margin: 0 8px;
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.05));
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &-receive {
    border: 1px solid var(--color-border-soft);
  }

  &-pay {
    border: 1px solid var(--color-border-soft);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: var(--text-primary);
}

.btn-add {
  background-color: var(--brand-primary);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  font-size: 20px;
  cursor: pointer;
}

.btn-minus {
  background-color: var(--color-send);
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
  color: var(--text-secondary);

  .label {
    font-weight: 500;
  }

  .value {
    font-weight: 600;
    color: var(--text-primary);
  }
}
</style>