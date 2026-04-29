<template>
  <div>
    <SearchForm
      :search-list="searchList"
      :search-params="searchParams"
      @search="onSearch"
      @reset="onReset"
    ></SearchForm>
    <div class="table-layout">
      <el-card shadow="never">
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
              <template slot-scope="scope">
                <span v-if="item.type === 'select'">
                  {{ item.mapping[scope.row[item.prop]] }}
                </span>
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
      </el-card>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { http } from "@/api";

// 定义响应式数据
const loading = ref(false);
const tableData = ref([]);
const pageNo = ref(1);
const pageSize = ref(10);
const pageSizes = ref([10, 20, 50, 100]);
const totalSize = ref(0);

// 搜索相关数据
const searchList = ref([
  {
    label: "登录时间",
    prop: "timeValue",
    name: "date",
    dateType: "datetimerange",
  },
]);

const searchParams = ref({
  startTime: "",
  endTime: "",
  timeValue: [],
});

// 表格列配置
const columns = ref([
  // 登录IP、IP归属地、登录时间
  { label: "登录IP", prop: "ip" },
  { label: "IP归属地", prop: "ipLocation" },
  { label: "登录时间", prop: "loginTime" },
]);

// 选择的数据
const selectedData = ref([]);

// 获取列表数据
const getList = async () => {
  loading.value = true;
  try {
    // 处理时间范围
    if (searchParams.value.timeValue && searchParams.value.timeValue.length === 2) {
      searchParams.value.startTime = searchParams.value.timeValue[0];
      searchParams.value.endTime = searchParams.value.timeValue[1];
    } else {
      searchParams.value.startTime = "";
      searchParams.value.endTime = "";
    }

    // 调用API获取数据
    const response = await http.loginRecord({
      page: pageNo.value,
      size: pageSize.value,
      startTime: searchParams.value.startTime,
      endTime: searchParams.value.endTime,
    });

    // 更新表格数据和分页信息
    tableData.value = response.data.list;
    totalSize.value = response.data.total;
  } catch (error) {
    console.error("获取登录记录失败:", error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const onSearch = () => {
  pageNo.value = 1; // 搜索时重置到第一页
  getList();
};

// 重置搜索
const onReset = () => {
  searchParams.value = {
    startTime: "",
    endTime: "",
    timeValue: [],
  };
  pageNo.value = 1;
  getList();
};

// 选择变化
const onSelect = (selection) => {
  selectedData.value = selection;
};

// 改变每页大小
const changePageSize = (size) => {
  pageSize.value = size;
  pageNo.value = 1;
  getList();
};

// 改变当前页
const changePageNo = (page) => {
  pageNo.value = page;
  getList();
};

// 初始化时获取数据
onMounted(() => {
  getList();
});
</script>

<style scoped lang="scss">
/* 隐藏 gutter 列 */
 ::v-deep(col[name="gutter"]) {
  display: none !important;
  width: 0 !important;
}

/* 隐藏 gutter th */
::v-deep(th.gutter) {
  display: none !important;
  width: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
}

</style>
