<template>
  <div class="page-container">
    <header class="page-header">
      <h1>{{ title }}</h1>
      <hr />
    </header>

    <main class="page-content">
      <div class="content-wrapper">
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
                type="primary"
                :icon="Refresh"
                @click="onSearch"
                :loading="loading"
              ></el-button>
  
            </div>
            <div class="table-box">
                
                 <el-table
                border
                v-loading="loading"
                max-height="600px"
                :data="tableData"
                element-loading-spinner="el-icon-loading"
                element-loading-background="rgba(255, 255, 255, 0.8)"
                @selection-change="onSelect"
              >
                <el-table-column
                  align="center"
                  v-for="item in columns"
                  :key="item.prop"
                  :prop="item.prop"
                  :label="item.label"
                >
                  <template #default="scope">
                    <span v-if="item.type === 'select'">
                      <!-- 如果等于-的话改成 -->
                      {{ scope.row.status == '-' ? '排队中' : item.mapping[scope.row[item.prop]] }}
                    </span>
             
                    <span v-else-if="item.prop !== 'fileurl'">{{
                      scope.row[item.prop]
                    }}</span>
                    <el-button
                      v-else
                      type="primary"
                      size="small"
                      :disabled="!scope.row.fileurl || !isValidUrl(scope.row.fileurl)"
                      @click="handleDownload(scope.row)"
                    >
                      下载
                    </el-button>
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
  { label: "文件名", prop: "fileName" },
  { label: "类型", prop: "type" },
  {
    label: "状态",
    prop: "status",
    isTag: true,
    tagType: "success",
    mapping: { 0: "生成中", 1: "生成成功", 2: "生成失败" },
  },
  { label: "导出时间", prop: "createtime" },
  { label: "操作", prop: "fileurl" },
]);

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

.page-container {
  background-color: #fff;
  border-radius: 24px;
  margin: $spacing-lg;
}

.page-header {
  padding: $spacing-lg;
  h1 {
    margin: 0;
    font-size: $font-size-xl;
    color: $text-color;
  }
  hr {
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizelegibility;
    color-scheme: light;
    font-feature-settings: "kern";
    font-family: "Geist Sans", sans-serif;
    line-height: 1.5;
    overflow-wrap: break-word;
    margin: 0px;
    box-sizing: content-box;
    height: 0px;
    overflow: visible;
    opacity: 0.2;
    border-width: 0px 0px 1px;
    border-image: initial;
    border-color: inherit;
    border-style: solid;
    width: 100%;
  }
}

.balance-info {
  font-weight: 500;
  color: $primary-color;
}

.notification-icon {
  font-size: $font-size-large;
  cursor: pointer;
  position: relative;
}

.page-content {
  padding: $spacing-lg;
}

.content-wrapper {
  background-color: white;
  // padding: $spacing-xl;
  border-radius: $border-radius-md;
  // box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-state {
  text-align: center;
  padding: $spacing-xl;
  color: #666;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: $spacing-lg;
  opacity: 0.5;
}

.empty-state h2 {
  margin: 0 0 $spacing-sm 0;
  font-size: $font-size-xl;
  color: $text-color;
}

.empty-state p {
  margin: 0;
  font-size: $font-size-base;
}
.search-container {
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 12px;
  margin-bottom: $spacing-lg;
  input{
    border-radius: 24px !important;
  }
}

/* 表格布局 */
.table-layout {
  width: 100%;
}

.table-handle {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.table-box {
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
  color: $text-color;
}

.notification-icon {
  font-size: $font-size-large;
  color: $primary-color;
}
</style>
