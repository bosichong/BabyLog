<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 15:51:28
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-28 18:35:58
 * @FilePath: /BabyLog/front/src/components/blog/BlogHeader.vue
-->
<template lang="">
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
      >
        
      <a-menu-item key="1">
            <router-link to="/blog/main">
                BabyLog
            </router-link>
        </a-menu-item>

        <a-menu-item key="2" v-if="menu.Blog">
            <router-link to="/blog/list">
                日志列表
            </router-link>
        </a-menu-item>


        
        <a-sub-menu key="sub1">
                    <template #title>
                        <span>
                            <span>添加数据</span>
                        </span>
                    </template>
                    <a-menu-item key="3" >
                        <router-link to="/blog/addblog">
                            <span>添加日志</span>
                        </router-link>
                    </a-menu-item>
                    <a-menu-item key="4">
                        <router-link to="/blog/addhealthy">
                            <span>添加身高体重</span>
                        </router-link>
                    </a-menu-item>
            </a-sub-menu>
        
        <a-menu-item key="15" v-if="menu.User">
            <router-link to="/admin/main">
            管理后台
            </router-link>
        </a-menu-item>
        
        
      </a-menu>
</template>
<script setup>
import { defineComponent, ref } from 'vue';
import axios from 'axios'
const selectedKeys = ref(['1'])
const openKeys = ref()

const menu = ref({})

// 获取菜单显示权限
axios.get('v1/get_menu', {
    headers: {
        "accept": "application / json",
        "Authorization": "Bearer " + sessionStorage.getItem('token')
    },
}).then((response) => {
    menu.value = response.data
    // console.log(menu.value);
})

</script>
<style >
h5.ant-typography,
.ant-typography h4 {
    color: rgba(255, 255, 255, 0.85);
}
</style>