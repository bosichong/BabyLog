<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 23:21:13
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-25 22:19:21
 * @FilePath: /BabyLog/front/src/components/blog/AddBlog.vue
-->
<template lang="">
    <div class="register">
        
        <a-form :model="formBlog" >
        <a-form-item>
            <a-radio-group v-model:value="formBlog.babys[1]" :options="formBlog.babys[0]" />
        </a-form-item>
        <a-form-item>
            <a-input v-model:value="formBlog.height" addon-before="Height:" />
        </a-form-item>
        <a-form-item>
            <a-input v-model:value="formBlog.weight" addon-before="Weight:" />
        </a-form-item>
        <a-form-item :wrapper-col="{ span: 24, offset: 0}">
            <a-button :disabled="editdisabled" type="primary" @click="onSubmit()" block>提交</a-button>
            <!-- <a-button type="primary" @click="test()" block>test</a-button> -->
        </a-form-item>
        </a-form>
    </div>
</template>


<script setup>
import { ref, reactive,computed, defineComponent, } from 'vue';
import { UsergroupAddOutlined, ExclamationCircleOutlined, LockOutlined, UserOutlined, EditFilled, DeleteFilled, } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import axios from 'axios'
import { useRouter } from "vue-router";
import { message, Upload } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';




const editdisabled = computed(() => {
    return !(formBlog.height && formBlog.weight && formBlog.babys[1][0]);
});

const onSubmit = (() => {
    // console.log('提交');
    axios.post('/v1/blog/create_healthy', {
        height: formBlog.height,
        weight: formBlog.weight,
        babys: formBlog.babys,
    }).then((response) => {
        if (response.data) {
            let model = Modal.info()
            model.update({
                title: '提示!',
                content: '添加成功!',
                onOk: () => {
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
    height: 0,
    weight: 0.0,
    babys: [[], []],
});


const getbabys = (() =>{
    console.log('kaishi');
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