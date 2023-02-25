<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 23:21:13
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2023-02-25 08:54:32
 * @FilePath: /BabyLog/front/src/components/blog/AddBlog.vue
-->
<template lang="">
    <div class="register">
        <a-form-item>
            <a-upload
            accept="null"
            :before-upload="beforeUpload" 
            v-model:file-list="fileList" 
            action="http://localhost:8888/v1/blog/uploadfile/"
            :headers="upload_headers"
            list-type="picture-card" 
            @preview="handlePreview"
            @remove="handleRemove"
            >
                <div v-if="fileList.length < 9">
                <plus-outlined />
                <div style="margin-top: 8px">Upload</div>
                </div>
            </a-upload>
            <a-modal :visible="previewVisible" :title="previewTitle" :footer="null" @cancel="handleCancel">
                <img alt="example" style="width: 100%" :src="previewImage" />
            </a-modal>

        </a-form-item>
        <a-form-item>
            <a-checkbox-group v-model:value="formBlog.babys[1]" :options="formBlog.babys[0]" />
        </a-form-item>
        <a-form :model="formBlog" >
        <a-form-item>
            <a-textarea v-model:value="formBlog.blog" placeholder="记录下今天与孩子的点滴." :rows="6"/>
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 24, offset: 0}">
            <a-button :disabled="editdisabled" type="primary" @click="onSubmit()" block>提交</a-button>
            <!-- <a-button type="primary" @click="test()" block>test</a-button> -->
        </a-form-item>
        </a-form>
    </div>
</template>
<script>
// export default {
//     // 组件内守卫
//     beforeRouteLeave: (to, from, next) => {
//         const answer = window.confirm('确定要放弃保存数据吗?')
//         if (answer) {
//             next()
//         } else {
//             return false
//         }
//     }

// }
</script>

<script setup>
import { ref, reactive,computed, defineComponent, } from 'vue';
import { UsergroupAddOutlined, ExclamationCircleOutlined, LockOutlined, UserOutlined, EditFilled, DeleteFilled, } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import axios from 'axios'
import { useRouter } from "vue-router";
import { message, Upload } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';




function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}
const upload_headers = reactive({
    "accept": "application / json",
    "Authorization": "Bearer " + sessionStorage.getItem('token')
})
const previewVisible = ref(false);
const previewImage = ref('');
const previewTitle = ref('');
const fileList = ref([]);
const handleCancel = () => {
    previewVisible.value = false;
    previewTitle.value = '';
};
const handlePreview = async file => {
    if (!file.url && !file.preview) {
        file.preview = await getBase64(file.originFileObj);
    }
    previewImage.value = file.url || file.preview;
    previewVisible.value = true;
    previewTitle.value = file.name || file.url.substring(file.url.lastIndexOf('/') + 1);
};

const beforeUpload = file => {
    // console.log(file.type);
    const isPNG = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg' || file.type === 'image/gif';
    if (!isPNG) {
        message.error(`${file.name} is not a png jpg jpge gif file`);
    }
    return isPNG || Upload.LIST_IGNORE;
};

const handleRemove = file => {
    let photo_path = file.response.file_path
    // console.log(photo_path);
    axios.post('/v1/blog/delete_img', {
        photo_path: photo_path
    }).then((res) => {
        // console.log(res.data);
    })

}


const editdisabled = computed(() => {
    return !(formBlog.blog && formBlog.babys[1][0]);
});

const onSubmit = (() => {
    // console.log('提交');
    axios.post('/v1/blog/create_blog', {
        blog: formBlog.blog,
        babys: formBlog.babys,
        photos: fileList.value,
        user_id: sessionStorage.getItem('user_id')
    }).then((response) => {
        if (response.data) {
            let model = Modal.info()
            model.update({
                title: '提示!',
                content: '添加成功!',
                onOk: () => {
                    fileList.value = [];
                    formBlog.blog = ''
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
})


const formBlog = reactive({
    blog: '',
    babys: [[], []],
});


const getbabys = (() =>{
    axios.get('/v1/blog/get_baby_names').then(function(response) {
        formBlog.babys=response.data.babys
    })
})

getbabys()

</script>
<style scoped>
header {
    line-height: 1.5;
}

.logo {
    display: block;
    margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
    header {
        display: flex;
        place-items: center;
        padding-right: calc(var(--section-gap) / 2);
    }

    .logo {
        margin: 0 2rem 0 0;
    }

    header .wrapper {
        display: flex;
        place-items: flex-start;
        flex-wrap: wrap;
    }
}
</style>