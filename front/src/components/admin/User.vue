<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-11-30 10:06:33
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-25 22:56:54
 * @FilePath: /MiniAdmin/front/src/components/admin/User.vue
-->
<template>
  <a-card style="margin-bottom: 10px;">
    <a-space>
      <a-input-search v-model:value="keyword" placeholder="搜索用户" @search="onSearch" />
      <a-button type="primary">创建新用户</a-button>
    </a-space>
  </a-card>
  <a-table :columns="columns" :data-source="data" :pagination="pagination">
    <template #headerCell="{ column }">
    </template>
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'sex'">
        <span v-if="record.sex === '0'">女</span>
        <span v-else>男</span>
      </template>
      <template v-else-if="column.key === 'is_active'">
        <a-switch v-model:checked="record.is_active" @click="active_change(record.id)" checked-children="开"
          un-checked-children="关" />
      </template>
      <template v-else-if="column.key === 'action'">
        <span>
          <a-button type="primary" size="small" @click="showDrawer(record.id)">
            <template #icon>
              <EditFilled />
            </template>
          </a-button>
          <a-divider type="vertical" />
          <a-button type="primary" size="small" @click="showDeleteConfirm(record.id)">
            <template #icon>
              <DeleteFilled />
            </template>
          </a-button>
          <a-divider type="vertical" />
          <a-button type="primary" size="small" @click="changeGroup(record.id)">
            <template #icon>
              <usergroup-add-outlined />
            </template>
          </a-button>
        </span>
      </template>
    </template>
  </a-table>



  <a-drawer width="550" v-model:visible="visible" class="custom-class" style="color: red" title="编辑用户资料"
    placement="right" @after-visible-change="afterVisibleChange">
    <a-form :model="formUserEdit" :label-col="labelCol" :wrapper-col="wrapperCol">
      <a-input v-model:value="formUserEdit.user_id" type="hidden" />
      <a-form-item label="登陆帐户:">
        <a-input v-model:value="formUserEdit.username">
          <template #prefix>
            <UserOutlined class="site-form-item-icon" />
          </template>
        </a-input>
      </a-form-item>
      <a-form-item label="登陆密码:" name="password">
        <a-input-password v-model:value="formUserEdit.password">
          <template #prefix>
            <LockOutlined class="site-form-item-icon" />
          </template>
        </a-input-password>
      </a-form-item>
      <a-form-item label="性别:">
        <a-radio-group v-model:value="formUserEdit.sex">
          <a-radio value="1">男</a-radio>
          <a-radio value="0">女</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="familymember:">
        <a-input v-model:value="formUserEdit.familymember" />
      </a-form-item>
      <a-form-item :wrapper-col="{ span: 14, offset: 4 }">
        <a-button type="primary" @click="onSubmit()">提交修改</a-button>
        <a-button style="margin-left: 10px" @click="onClose">取消</a-button>
      </a-form-item>
    </a-form>
  </a-drawer>


  <a-drawer title="修改用户组" width="550" v-model:visible="changeGroupvisible">
    <template #extra>
      <a-button @click="changeGroupClose">取消</a-button>
      <a-button type="primary" @click="changeusergroup">提交</a-button>
    </template>



    <a-checkbox-group v-model:value="checkeds.value" :options="options.value" />


  </a-drawer>

</template>
<script setup>
import { ref, reactive, toRaw, createVNode } from 'vue';
import axios from 'axios'
import { UsergroupAddOutlined, ExclamationCircleOutlined, LockOutlined, UserOutlined, EditFilled, DeleteFilled, } from '@ant-design/icons-vue';

import { Modal } from 'ant-design-vue';

const keyword = ref('');

// 默认打开页面后的请求数据
const openPage = () => {
  axios.get('v1/user/get_users', {
    params: {
      keyword: keyword.value
    },
  }).then(function (response) {
    data.value = response.data.users
    count.value = response.data.count
    // console.log(data);
  }).catch(function (error) {
    console.log(error)
  })
}

// 搜索结果
const onSearch = searchValue => {
  openPage()

};
// ##########################
const options = reactive([]) // 渲染所有权限的多选框
const checkeds = reactive([]) // 选中已经选择的
const changeGroupvisible = ref(false)
const cuser_id = ref(0)// 准备修改用户组的id
const changeGroupClose = () => {
  changeGroupvisible.value = false;
}
// 打开修改用户组的抽屉
const changeGroup = (user_id) => {
  axios.get('/v1/user/get_user_role', {
    params: {
      user_id: user_id
    }
  }).then((response) => {
    options.value = response.data.options
    checkeds.value = response.data.checkeds
    cuser_id.value = user_id
    changeGroupvisible.value = true
  }).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
        onOk: () => {
          visible.value = false
        }
      })
    }
  })


}


// 修改用户组权限
const changeusergroup = () => {
  // console.log(checkeds.value);
  // console.log(change_role_id.value);
  axios.post('v1/user/change_user_role', {
    user_id: cuser_id.value,
    names: checkeds.value
  }).then((response) => {
    if (response.data) {
      let model = Modal.info()
      model.update({
        title: '提示!',
        content: '修改成功!',
        onOk: () => {
          changeGroupvisible.value = false
        }
      })
    } else {
      let modal = Modal.error()
      modal.update({
        title: '错误!',
        content: "修改失败!请检查权限参数",
      })
    }
  }).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
        onOk: () => {
          visible.value = false
        }
      })

    }
  })
}



// ###########################
// 编辑资料抽屉
const visible = ref(false);// 抽屉开关
const afterVisibleChange = bool => {
  // console.log('visible', bool);
};

// 打开编辑用户资料的抽屉
const showDrawer = (user_id) => {
  axios.get("v1/user/user_by_id", {
    params: { user_id: user_id }
  }).then((function (response) {
    formUserEdit.user_id = user_id
    formUserEdit.username = response.data.username
    formUserEdit.familymember = response.data.familymember
    formUserEdit.sex = response.data.sex
    visible.value = true;
  })).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
        onOk: () => {
          visible.value = false
        }
      })

    }
  })


}


// 编辑用户资料的表单相关
const formUserEdit = reactive({
  user_id: 0,
  username: '',
  password: '',
  sex: '',
  familymember: '',
});

/**
 * 提交修改用户资料
 */
const onSubmit = () => {
  // console.log('submit!', toRaw(formUserEdit));
  axios.post('/v1/user/update_user', {
    user_id: formUserEdit.user_id,
    username: formUserEdit.username,
    password: formUserEdit.password,
    sex: formUserEdit.sex,
    familymember:formUserEdit.familymember,
  },).then((response) => {
    if (response.data) {
      onPageChange(c.value, p.value)
      let model = Modal.info()
      model.update({
        title: '提示!',
        content: '修改成功!',
        onOk: () => {
          visible.value = false
        }
      })

    }
  }).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
      })

    }
  })
};
const onClose = () => {
  visible.value = false;
}

const labelCol = reactive({
  style: {
    width: '150px',
  },
})
const wrapperCol = reactive({
  span: 14,
})

// 表头
const columns = ref([
  {
    title: 'Id',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  }, {
    title: '性别',
    dataIndex: 'sex',
    key: 'sex',
  }, {
    title: 'familymember',
    key: 'familymember',
    dataIndex: 'familymember',
  },
  {
    title: '是否锁定',
    key: 'is_active',
    dataIndex: 'is_active',
  }, {
    title: '管理',
    key: 'action',
  }])
const data = ref([]) // 数据
const c = ref(1) //当前页码
const p = ref(10) //当前每页显示数据条数
const count = ref(0) //数据总数
//表头翻页配置
const pagination = ref({
  pageNo: 1,
  pageSize: 10, // 默认每页显示数量
  showSizeChanger: false, // 显示可改变每页数量
  pageSizeOptions: ['10', '20', '50', '100'], // 每页数量选项
  showTotal: total => `共 ${total} 条`, // 显示总数
  onShowSizeChange: (current, pageSize) => onSizeChange(current, pageSize), // 改变每页数量时更新显示
  onChange: (page, pageSize) => onPageChange(page, pageSize),//点击页码事件
  total: count //总条数
})

openPage()




/**
 *  翻页回调数据
 * @param {*} page 当前页码
 * @param {*} pageSize 每页显示条数
 */
const onPageChange = (page, pageSize) => {
  c.value = page
  p.value = pageSize
  let skip1 = 10 * (page - 1)
  let limit1 = pageSize
  axios.get('v1/user/get_users',
    {
      params: {
        skip: skip1,
        limit: limit1,
        keyword: keyword.value
      },
    },
  ).then(function (response) {
    data.value = response.data.users
    count.value = response.data.count
  })
}

/**
 * 锁定用户开关
 * @param {*} id 
 */
const active_change = (id) => {
  axios.get('v1/user/active_change', {
    params: { user_id: id },
  },).then(function (response) {
    if (response.data) {
      // onPageChange(c.value,p.value)
    }

  }).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
        onOk: () => {
          visible.value = false
          onPageChange(c.value, p.value)
        }
      })
    }
  })

}

/**
 * 删除用户
 * @param {*} id 
 */
const showDeleteConfirm = (id) => {
  Modal.confirm({
    title: '确定要删除吗?',
    icon: createVNode(ExclamationCircleOutlined),
    content: '确定后会删除此用户',
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk() {
      axios.get('v1/user/delete_user', {
        params: { user_id: id },
      }).then(function (response) {
        if (response.data) {
          onPageChange(c.value, p.value)
          let model = Modal.info()
          model.update({
            title: '提示!',
            content: '删除成功!'
          })
        }
      }).catch(function (error) {
        if (error.response.data.detail === '您没有该权限！') {
          let model = Modal.error()
          model.update({
            title: '错误!',
            content: error.response.data.detail,
            onOk: () => {
              visible.value = false
            }
          })
        } else {
          let model = Modal.error()
          model.update({
            title: '提示!',
            content: '删除失败!' + error.response.data.detail
          })
        }
      })
    },
    onCancel() {
      console.log('Cancel');
    },
  });
}


</script>
<style lang="">
    
</style>