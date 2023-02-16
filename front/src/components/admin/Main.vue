<!--
 * @Author: J.sky bosichong@qq.com
 * @Date: 2022-12-01 08:24:37
 * @LastEditors: J.sky bosichong@qq.com
 * @LastEditTime: 2023-02-16 15:58:44
 * @FilePath: /MiniAdmin/front/src/components/admin/main.vue
-->
<template lang="">
    <div>
        <a-card title="打包整个程序进行备份">
        <p>将整个程序的源文件、数据库、已上传的相片以及程序的配置文件等，全部打包为zip文件进行备份！定期进行备份可以防止数据丢失！</p>
        <p>打包的后的zip文件在项目的根目录下：baby_back.zip，备份好后，请及时把备份的文件转移到其他存储介质上，例如网盘、邮箱、移动存储设备等，防止数据丢失。</p>
        <p>若当前的项目文件或数据损毁丢失，可以使用备份来恢复部分数据文件</p>
        <p>若准备好了，请点击备份按钮开始备份，备份文件数据需要一些时间，请耐心等待。</p>
        <p>
          <a-button type="primary" :disabled="btn_disabled" @click="back_zip">{{btn_str}}</a-button>
    
        </p>
      </a-card>
    </div>
</template>
<script setup>
import { ref, reactive, toRaw, createVNode } from 'vue';
import axios from 'axios'
import { Modal } from 'ant-design-vue';

const btn_str = ref('点击开始备份整个项目')
const btn_disabled = ref(false)

const back_zip = () => {
    btn_str.value = '正在备份中，请耐心等待！'
    btn_disabled.value = true
    axios.get('/v1/back_zip').then((response) => {
    if (response.data) {
      let model = Modal.info()
      model.update({
        title: '提示!',
        content: '打包备份成功!',
        onOk: () => {
            btn_str.value = '点击开始备份整个项目'
            btn_disabled.value = false
          
        }
      })
    } else {
      let modal = Modal.error()
      modal.update({
        title: '错误!',
        content: "打包失败",
      })
    }
  }).catch(function (error) {
    if (error) {
      let model = Modal.error()
      model.update({
        title: '错误!',
        content: error.response.data.detail,
        onOk: () => {
          
        }
      })

    }
  })
}


</script>
<style lang="">
    
</style>