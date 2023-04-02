<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-19 15:36:50
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2022-12-28 19:25:28
 * @FilePath: /BabyLog/front/src/components/blog/main.vue
-->
<template lang="">
      <div :style="{ minHeight: '280px' }">
      <a-card :bordered="false" class="homecard">
      <div v-for="item in babysdata" :key="item.id">
        <a-typography-title :level="3"><a-typography-text type="success">Baby:</a-typography-text>{{ item.name }}</a-typography-title>
        <p>出生于:{{item.birthday}},年龄:{{item.year}},您的孩纸已经出生:{{item.day}}天,系统中共有{{item.count}}条关于ta的记录</p>
      </div>
      </a-card>  

        <div v-for="(item, index) in babysdata">
        <!-- 为 ECharts 准备一个具备大小（宽高）的 DOM -->
        <div :id="'main'+index"  style="width:100%;height:400px;"></div>
        </div>


      <a-list :grid="{ gutter: 24, column: 1 }"  size="large" :data-source="blogs">
        <template #header>
            <a-typography-title :level="4"><a-typography-text type="success">那年今日 >>></a-typography-text></a-typography-title>
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
        </a-list>


      </div>
</template>
<script setup>
import { reactive, ref } from 'vue';
import axios from 'axios'
import { diaplayTime } from '../../util'

// 引入echarts
import * as echarts from 'echarts'
import { onMounted } from "vue";

const babysdata = ref([])

const main_getbabysdata = function () {
    axios.get('/v1/blog/main_babysdata').then(function (response) {
        // console.log(response.data);
        babysdata.value = response.data

    })
}

main_getbabysdata()




const show = ref(true) // 图片显示
const blogs = ref([])

const openList = () => {
    axios.get('/v1/blog/get_old_blogs').then(function (response) {
        // console.log(response.data)
        blogs.value = response.data.blogs
    })
}

openList()


onMounted(() => {

    axios.get('/v1/blog/get_ecdata').then(function (res) {
        const data  = res.data.data
        // console.log(data);
        for (let index = 0; index < data.length; index++) {
            const element = data[index];
            // console.log(element);
            let chart_id = "main"+index;
            let chartDom = document.getElementById(chart_id);
            let myChart = echarts.init(chartDom);
            let option;

            option = {
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: element.legend_data
                },
                xAxis: {
                    type: 'category',
                    data: element.times
                },
                yAxis: {
                    type: 'value'
                },
                series: element.series
            };
            option && myChart.setOption(option);
        }
    })

})


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

.homecard {
    margin-bottom: 16px;
}
</style>