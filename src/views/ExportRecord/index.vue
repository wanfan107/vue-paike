<template>
  <div class="app-page">
    <header class="app-page-header">
      <h1>{{ title }}</h1>
    </header>

    <main>
      <!-- 通知卡片 -->
      <el-card class="notification-card">
        <div class="notification-content">
          <i class="el-icon-info-circle notification-icon"></i>
          <span>导出的文件生成后保留三天，三天后会自动删除。</span>
        </div>
      </el-card>

      <div class="table-layout">
        <div class="table-handle">
          <el-button
            :icon="Refresh"
            @click="onSearch"
            :loading="loading"
          >刷新</el-button>
        </div>
        <div class="table-panel">
          <el-table
            stripe
            v-loading="loading"
            max-height="600px"
            :data="tableData"
            element-loading-spinner="el-icon-loading"
            element-loading-background="var(--el-mask-color, rgba(255, 255, 255, 0.8))"
            @selection-change="onSelect"
          >
            <el-table-column
              v-for="item in columns"
              :key="item.prop"
              :prop="item.prop"
              :label="item.label"
              :align="item.align || 'center'"
            >
              <template #default="scope">
                <StatusPill
                  v-if="item.prop === 'status'"
                  :type="getStatusType(scope.row.status)"
                  :text="getStatusText(scope.row.status)"
                />
                <el-button
                  v-else-if="item.prop === 'fileurl'"
                  type="primary"
                  size="small"
                  :disabled="!scope.row.fileurl || !isValidUrl(scope.row.fileurl)"
                  @click="handleDownload(scope.row)"
                >
                  下载
                </el-button>
                <span v-else>{{ scope.row[item.prop] }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="page-box">
          <el-pagination
            background
            :current-page="pageNo"
            :page-sizes="pageSizes"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalSize"
            @size-change="changePageSize"
            @current-change="changePageNo"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { Refresh } from "@element-plus/icons-vue";
import { http } from "@/api";
import useUserStore from "@/stores/user";
import { ElMessage } from 'element-plus';
import StatusPill from "@/components/StatusPill.vue";
// 导出记录
const props = defineProps({
  title: {
    type: String,
    default: "导出记录",
  },
});

// 定义响应式数据
const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(10);
const pageSizes = ref([10, 20, 30, 50, 100]);
const totalSize = ref(0);
const tableData = ref([]);
const selectedRows = ref([]);
const timer = ref(null);

// 请求配置
const request = reactive({
  page: http.exportList,
});


const UserStore = useUserStore();
// 搜索参数
const searchParams = reactive({
  // 账单时间
  billTime: [],
  // 类型
  type: "",
  // 平台订单号
  orderNo: "",
  // 商户订单号
  merchantOrderNo: "",
  id:UserStore.merchantInfo.id,
});

// 表格列配置
const columns = reactive([
  // 文件名、类型、状态
  { label: "文件名", prop: "fileName", align: "left" },
  { label: "类型", prop: "type", align: "center" },
  { label: "状态", prop: "status", align: "center" },
  { label: "创建人", prop: "creatorName", align: "center" },
  { label: "创建时间", prop: "createdon", align: "center" },
  { label: "操作", prop: "fileurl", align: "center" },
]);

// 状态列文案映射（0→生成中 / 1→生成成功 / 2→生成失败 / '-'→排队中）
const STATUS_TEXT = { 0: "生成中", 1: "生成成功", 2: "生成失败" };
const getStatusText = (status) => {
  if (status === "-") return "排队中";
  return STATUS_TEXT[status] ?? status;
};
const getStatusType = (status) => {
  const s = Number(status);
  if (s === 1) return "success";
  if (s === 2) return "danger";
  return "neutral";
};

// 验证URL是否有效
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// 处理文件下载
const handleDownload = (row) => {
  if (!row.fileurl || !isValidUrl(row.fileurl)) {
    return;
  }
  
  try {
    // 创建隐藏的a标签
    const link = document.createElement('a');
    link.href = row.fileurl;
    
    // 设置download属性，强制浏览器下载文件
    // 从URL中提取文件名或使用默认名称
    const fileName = row.fileName || `export_${new Date().getTime()}.xlsx`;
    link.download = fileName;
    
    // 将a标签添加到文档中
    document.body.appendChild(link);
    
    // 触发点击事件
    link.click();
    
    // 清理，移除a标签
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载失败:', error);
    // 可以添加错误提示
    ElMessage.error('文件下载失败，请稍后重试');
  }
};

// 处理行选择
const onSelect = (selection) => {
  selectedRows.value = selection;
};

// 搜索方法
const onSearch = async () => {
  try {
    loading.value = true;
    const params = {
      ...searchParams,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    };
    
    // 处理日期范围
    if (params.billTime && params.billTime.length === 2) {
      params.startTime = params.billTime[0];
      params.endTime = params.billTime[1];
      delete params.billTime;
    }
    
    const res = await request.page(params);
    
    if (res.code === 200) {
      tableData.value = res.data.list || [];
      totalSize.value = res.data.total || 0;
    }
  } catch (error) {
    console.error("获取数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 更改每页条数
const changePageSize = (newSize) => {
  pageSize.value = newSize;
  pageNo.value = 1;
  onSearch();
};

// 更改当前页码
const changePageNo = (newPage) => {
  pageNo.value = newPage;
  onSearch();
};

// 组件挂载后执行
onMounted(() => {
  // 初始加载数据
  onSearch();
  
  // 每过30秒执行一次
  timer.value = setInterval(() => {
    onSearch();
  }, 30000);
});

// 组件销毁前清除定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>
<style scoped lang="scss">
@use "../../styles/variables.scss" as *;

/* 表格布局 */
.table-layout {
  width: 100%;
}

.table-handle {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.table-panel {
  margin-bottom: 15px;
}

.page-box {
  margin-top: $spacing-lg;
  display: flex;
  justify-content: center;
}

/* 隐藏 gutter 列 */
:deep(col[name="gutter"]) {
  display: none !important;
  width: 0 !important;
}

/* 隐藏 gutter th */
:deep(th.gutter) {
  display: none !important;
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

.notification-card {
  margin-bottom: $spacing-lg;
  border-left: 4px solid $primary-color;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  font-weight: 500;
  color: var(--text-primary, #18181b);
}

.notification-icon {
  font-size: $font-size-large;
  color: $primary-color;
  cursor: pointer;
  position: relative;
}
</style>
