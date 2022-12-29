<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-26 09:05:14
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-26 14:52:41
 * @FilePath: /BabyLog/front/src/components/admin/Healthy.vue
-->
<template lang="">
    <a-card style="margin-bottom: 10px;">
      <a-space>
      <a-button type="primary" @click="">新建Healthy</a-button>
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







<a-drawer title="编辑healthy" width="350" v-model:visible="editvisible">
<a-form :model="editcoform" layout="vertical" >
    <a-input v-model:value="editcoform.healthy_id" type="hidden" />
      <a-form-item label="height" name="height">
        <a-input v-model:value="editcoform.height" placeholder="height:" />
      </a-form-item>
      <a-form-item label="weight" name="weight">
        <a-input v-model:value="editcoform.weight" placeholder="weight" />
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
    healthy_id: 0,
    height: '',
    weight: '',
})

const editvisible = ref(false)

const editdisabled = computed(() => {
    return !(editcoform.height && editcoform.weight);
});
// 打开编辑资料的抽屉
const editshowDrawer = (healthy_id) => {
    axios.get('/v1/blog/get_healthy_by_id', {
        params: {
            healthy_id: healthy_id
        }
    }).then(function (response) {
        // console.log(response.data);
        editcoform.height = response.data.height
        editcoform.weight = response.data.weight
        editcoform.healthy_id = healthy_id
        editvisible.value = true
    })


}
const editonClose = () => {
    editvisible.value = false;
};

// 提交修改用户组(角色)的资料
const editRole = () => {
    axios.post('/v1/blog/update_healthy', {
        old_healthy_id: editcoform.healthy_id,
        height: editcoform.height,
        weight: editcoform.weight,
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

const deleteRole = (healthy_id) => {
    Modal.confirm({
        title: '确定要删除吗?',
        icon: createVNode(ExclamationCircleOutlined),
        content: '确定后会删除此条数据!',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk() {
            axios.get('v1/blog/delete_healthy', {
                params: { healthy_id: healthy_id },
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




// 表头
const columns = ref([
    {
        title: 'Id',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'heigit',
        dataIndex: 'height',
        key: 'heigit',
    }, {
        title: 'weight',
        key: 'weight',
        dataIndex: 'weight',
    }, 
    {
        title: 'create_time',
        key: 'create_time',
        dataIndex: 'create_time',
    },{
        title: 'baby_id',
        key: 'baby_id',
        dataIndex: 'baby_id',
    },
    {
        title: '管理',
        key: 'action',
    }])
const data = ref([]) // 数据

// 默认打开页面后的请求数据
const openPage = () => {
    axios.get('v1/blog/get_healthy',).then(function (response) {
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