<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 20:33:33
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-28 19:22:51
 * @FilePath: /BabyLog/front/src/components/blog/List.vue
-->
<template lang="">
   
      <div :style="{ minHeight: '280px' }">
        
    <a-list :grid="{ gutter: 24, column: 1 }"  size="large" :data-source="blogs">
        <template #header>
        <a-space>
            <a-input-search v-model:value="keyword" placeholder="请输入关键字" @search="onSearch" />
        </a-space>
        </template>

        <template #renderItem="{ item }">
            <a-list-item>
                <a-card size="small" :bordered="false">
                    <template #extra>
                    {{item.user.familymember}}:在
                    <a-tooltip>
                        <template #title>{{item.create_time}}</template>
                        {{diaplayTime(item.create_time)}}
                    </a-tooltip>
                    添加了一条关于{{item.baby_names}}数据
                    <a-divider type="vertical" />
                    <a-button  size="small" @click="editshowDrawer(item.id)">
                        <template #icon>
                        <EditFilled />
                        </template>
                    </a-button>
                    <a-divider type="vertical" />
                    <a-button  size="small" @click="delete_blog(item.id)">
                        <template #icon>
                        <DeleteFilled />
                        </template>
                    </a-button>
                    </template>
                    <div v-html="item.blog"></div>
                    <a-row v-if="show && item.photos.length">
                        <a-col :xs="8" :sm="6" :md="4" :xl="2" v-for="p of item.photos">
                            <a-image :width="110" :src="p"/>
                        </a-col>    
                    </a-row>
                    
                </a-card>
            
            </a-list-item>
        </template>

        <template #footer>

                <a-pagination @change="showSizeChange" v-model:current="current" :total="count" />
        </template>
        </a-list>
      
      </div>





    <a-drawer title="编辑资源" width="550" v-model:visible="editvisible">
        <a-form :model="formBlog" >
        <a-form-item>
            <a-checkbox-group v-model:value="formBlog.babys[1]" :options="formBlog.babys[0]" />
        </a-form-item>
        <a-form-item>
            <a-textarea v-model:value="formBlog.blog" placeholder="记录下今天与孩子的点滴." :rows="6"/>
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 24, offset: 0}">
            <a-button :disabled="editdisabled" type="primary" @click="updateblog" block>提交</a-button>
        </a-form-item>
        </a-form>
    <template #extra>
        <a-button @click="editonClose">取消</a-button>
    </template>
  </a-drawer>

  <a-back-top />
</template>


<script setup>
import { PlusOutlined, UsergroupAddOutlined, ExclamationCircleOutlined, LockOutlined, UserOutlined, EditFilled, DeleteFilled, } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import { reactive, ref, computed, createVNode } from 'vue';
import axios from 'axios'
import { diaplayTime } from '../../util'


const formBlog = reactive({
    blog_id: 0,
    blog: '',
    babys: [[], []],
});

const editvisible = ref(false)

const editdisabled = computed(() => {
    return !(formBlog.blog && formBlog.babys[1][0]);
});

const updateblog = () => {
    axios.post('/v1/blog/update_blog', {
        blog_id: formBlog.blog_id,
        blog: formBlog.blog,
        babys: formBlog.babys
    }).then((response) => {
        if (response.data) {
            let model = Modal.info()
            model.update({
                title: '提示!',
                content: '添加成功!',
                onOk: () => {
                    editonClose()
                    openList()
                }
            })
        } else {
            let modal = Modal.error()
            modal.update({
                title: '错误!',
                content: "添加失败!请检查权限参数",
            })
        }
    }).catch(function (error) {
        let modal = Modal.error()
        modal.update({
            title: '错误!',
            content: "添加失败!" + error.response.data.detail,
        })
    })
}

// 打开编辑资料的抽屉
const editshowDrawer = (blog_id) => {
    // console.log(blog_id);
    formBlog.blog_id = blog_id;
    axios.get('/v1/blog/get_blog_by_id', {
        params: { blog_id: blog_id }
    }).then((response) => {
        // console.log(response.data);
        formBlog.blog = response.data.blog
        formBlog.babys = response.data.babys
    })
    editvisible.value = true
}
const editonClose = () => {
    formBlog.blog_id = 0
    formBlog.blog = ''
    formBlog.babys = []
    editvisible.value = false;
};

///////////////// //////////////////////////////////

const show = ref(true) // 图片显示

const blogs = ref([])
const count = ref(0)
const current = ref(1)
const keyword = ref('')

const c = ref(1) //当前页码
const p = ref(10) //当前每页显示数据条数


const openList = () => {
    axios.get('/v1/blog/get_blogs', {
        params: {
            keyword: keyword.value
        },
    }).then(function (response) {
        blogs.value = response.data.blogs
        count.value = response.data.blog_count

        // console.log(diaplayTime(blogs.value[0].create_time));

    })
}

openList()

// 搜索结果
const onSearch = searchValue => {
    openList()

};


const showSizeChange = (current, size) => {
    // console.log(current, size)
    c.value = current
    p.value = size
    let skip1 = size * (current - 1)
    let limit1 = size
    axios.get('/v1/blog/get_blogs',
        {
            params: {
                skip: skip1,
                limit: limit1,
                keyword: keyword.value
            },
        },
    ).then(function (response) {
        // console.log(response.data)
        blogs.value = response.data.blogs
        count.value = response.data.blog_count

    })
}

// 删除blog
const delete_blog = (id) => {



    Modal.confirm({
        title: '确定要删除吗?',
        icon: createVNode(ExclamationCircleOutlined),
        content: '确定后会删除此条数据和相关的图片!',
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk() {

            axios.get('/v1/blog/delete_blog', {
                params: { id: id }
            }).then(function (res) {
                if (res.data) {
                    openList()
                    let model = Modal.info()
                    model.update({
                        title: '提示!',
                        content: '删除成功!'
                    })
                }
            }).catch(function (error) {
                let modal = Modal.error()
                modal.update({
                    title: '错误!',
                    content: "修改失败!" + error.response.data.detail,
                })

            })
        },
        onCancel() {
            console.log('Cancel');
        },
    });

}





</script>



<style>
.ant-list-footer {
    text-align: center;
}

.ant-list-split .ant-list-header {
    border-bottom: none;
}

.ant-card-extra {
    float: left;
    margin-left: inherit;
}

.ant-list-lg .ant-list-item {
    padding: 0px;
}

.ant-card {
    font-size: 16px;
}
</style>