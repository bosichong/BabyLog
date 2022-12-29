<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-26 09:04:56
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-26 11:02:16
 * @FilePath: /BabyLog/front/src/components/admin/Baby.vue
-->
<template lang="">
        <a-card style="margin-bottom: 10px;">
          <a-space>
          <a-button type="primary" @click="showDrawer">新建一个baby</a-button>
          </a-space>
    </a-card>
    <a-table :columns="columns" :data-source="data">
      <template #headerCell="{ columns }">
      </template>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <span>
            <a-button type="primary" size="small" @click="editshowDrawer(record.id)">
                <template #icon><EditFilled /></template></a-button>
            <a-divider type="vertical" />
            <a-button type="primary" size="small" @click="deleteRole(record.id)"><template #icon><DeleteFilled /></template></a-button>
          </span>
        </template>
      </template>
    </a-table>





    <a-drawer title="创建baby" width="350" v-model:visible="visible">
      <a-form :model="createCoform" :rules="coformrules" layout="vertical" @finish="onCoFinish"
              @finishFailed="onCoFinishFailed">
            <a-form-item label="宝贝名称" name="name">
              <a-input v-model:value="createCoform.name" placeholder="宝贝名称" />
            </a-form-item>
            <a-form-item label="birthday" name="birthday">
              <a-input v-model:value="createCoform.birthday" placeholder="宝贝生日 格式:2022-02-22" />
            </a-form-item>
      </a-form>
      <template #extra>
          <a-button @click="onClose">取消</a-button>
          <a-button :disabled="disabled" type="primary" @click="onCoFinish">提交</a-button>
      </template>
    </a-drawer>

    <a-drawer title="编辑baby" width="350" v-model:visible="editvisible">
    <a-form :model="editcoform" :rules="coformrules" layout="vertical" @finish="onCoFinish">
        <a-input v-model:value="editcoform.baby_id" type="hidden" />
          <a-form-item label="宝贝名字" name="name">
            <a-input v-model:value="editcoform.name" placeholder="宝贝名称" />
          </a-form-item>
          <a-form-item label="birthday" name="birthday">
            <a-input v-model:value="editcoform.birthday" placeholder="宝贝生日 格式:2022-02-22" />
          </a-form-item>
    </a-form>
    <template #extra>
        <a-button @click="editonClose">取消</a-button>
        <a-button :disabled="editdisabled" type="primary" @click="editRole">提交</a-button>
    </template>
  </a-drawer>
</template>
<script setup>

import { PlusOutlined, ExclamationCircleOutlined, EditFilled, DeleteFilled, } from '@ant-design/icons-vue';
import { reactive, ref, computed, createVNode } from 'vue';
import axios from 'axios'
import { Modal } from 'ant-design-vue';


const editcoform = reactive({
    baby_id: 0,
    name: '',
    birthday: '',
})

const editvisible = ref(false)

const editdisabled = computed(() => {
    return !(editcoform.name && editcoform.birthday );
});
// 打开编辑资料的抽屉
const editshowDrawer = (baby_id) => {
    axios.get('/v1/blog/get_baby', {
        params: {
            baby_id: baby_id
        }
    }).then(function (response) {
        editcoform.name = response.data.name
        editcoform.birthday = response.data.birthday
        editcoform.baby_id = baby_id
        editvisible.value = true
    })


}
const editonClose = () => {
    editvisible.value = false;
};

// 提交修改用户组(角色)的资料
const editRole = () => {
    axios.post('/v1/blog/update_baby', {
        old_baby_id: editcoform.baby_id,
        name: editcoform.name,
        birthday: editcoform.birthday,
    },).then(function (response) {
        if (response.data) {
            let model = Modal.info()
            model.update({
                title: '提示!',
                content: '修改成功!',
                onOk: () => {
                    editvisible.value = false
                    openPage()
                }
            })
        } else {
            let modal = Modal.error()
            modal.update({
                title: '错误!',
                content: "修改失败!",
            })
        }
    }).catch(function (error) {
    let modal = Modal.error()
    modal.update({
      title: '错误!',
      content: "修改失败!" + error.response.data.detail,
    })
  })
}

const deleteRole = (baby_id) => {
    Modal.confirm({
        title: '确定要删除吗?',
        icon: createVNode(ExclamationCircleOutlined),
        content: '确定后会删除此宝贝及其相关的日志!',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
            axios.get('v1/blog/delete_baby', {
                params: { baby_id: baby_id },
            }).then(function (response) {
                if (response.data) {
                    openPage()
                    let model = Modal.info()
                    model.update({
                        title: '提示!',
                        content: '删除成功!'
                    })
                }
            }).catch(function (error) {
                let model = Modal.error()
                model.update({
                    title: '提示!',
                    content: "修改失败!" + error.response.data.detail,
                })

            })
        },
        onCancel() {
            console.log('Cancel');
        },
    });
}








// ###############

const createCoform = reactive({
    name: '',
    birthday: '',
})
const coformrules = {
    name: [{
        required: true,
        message: 'Please enter name',
    }],
    birthday: [{
        required: true,
        message: 'Please enter object_key',
    }]

}
const visible = ref(false)

const showDrawer = () => {
    visible.value = true
}
const onClose = () => {
    visible.value = false;
};

// 增加baby
const onCoFinish = () => {
    // console.log(createCoform);
    axios.post('/v1/blog/create_baby', {
        name: createCoform.name,
        birthday: createCoform.birthday,
    }).then(function (response) {
        if (response.data) {
            let model = Modal.info()
            model.update({
                title: '提示!',
                content: '创建成功!',
                onOk: () => {
                    visible.value = false
                    openPage()
                }
            })
        } else {
            let modal = Modal.error()
            modal.update({
                title: '错误!',
                content: "创建失败!",
            })
        }
        createCoform.name = ''
        createCoform.birthday = ''
    }).catch(function (error) {
        if (error) {
            let model = Modal.error()
            model.update({
                title: '错误!',
                content: error.response.data.detail,
                onOk: () => {
                    visible.value = false
                    createCoform.name = ''
                    createCoform.birthday = ''
                }
            })

        }
    })

};
const onCoFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
};
const disabled = computed(() => {
    return !(createCoform.name && createCoform.birthday );
});

// 表头
const columns = ref([
    {
        title: 'Id',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'name',
        dataIndex: 'name',
        key: 'name',
    }, {
        title: '生日',
        key: 'birthday',
        dataIndex: 'birthday',
    }, {
        title: '管理',
        key: 'action',
    }])
const data = ref([]) // 数据

// 默认打开页面后的请求数据
const openPage = () => {
    axios.get('v1/blog/get_babys',).then(function (response) {
        data.value = response.data
        // console.log(data);
    }).catch(function (error) {
        console.log(error)
    })
}
openPage()

</script>

<style lang="">
    
</style>