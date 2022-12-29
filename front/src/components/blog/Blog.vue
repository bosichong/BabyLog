<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 15:41:13
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-20 10:26:32
 * @FilePath: /BabyLog/front/src/components/blog/Blog.vue
-->
<template lang="">
    <a-layout class="layout">
    <a-layout-header style="padding: 0 10px">
      <BlogHeader />
    </a-layout-header>
    <a-layout-content style="padding: 10px 10px">
        <router-view></router-view>
    </a-layout-content>
    <a-layout-footer style="text-align: center">
      <BlogFooter />
    </a-layout-footer>
  </a-layout>
</template>
<script setup>

import BlogHeader from './BlogHeader.vue';
import BlogFooter from './BlogFooter.vue';


</script>
<style >
.logo {
    float: left;
    width: 120px;
    height: 31px;
    margin: 16px 24px 16px 0;
    background: none;
    text-align: center;
}
</style>