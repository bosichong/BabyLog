package net.vv2.Utils;


import com.xiaoleilu.hutool.util.PageUtil;

/**
 * 简单分页工具
 * 返回总页数，并根据当前页值取得mysql limit 偏移量值
 * @author J.Sky bosichong@qq.com
 * @create 2017-06-13 11:16
 **/
public class PageHelp {


    /**
     * 总记录数
     */
    private int count;

    /**
     * 每页行数
     */
    private int rows =10;

    /**
     * 当前页数值 默认为1
     */
    private int pageNum = 1;






    public PageHelp() {
    }

    /**
     *
     * @param count 记录总数
     * @param pageNum 当前页码数
     * @param rows 每页显示的行数
     */
    public PageHelp(int count, int pageNum,int rows) {
        this.count = count;
        this.rows = rows;
        this.pageNum = pageNum;
    }

    public void setCount(int count) {
        this.count = count;
    }

    public void setRows(int rows) {
        this.rows = rows;
    }

    public void setPageNum(int pageNum) {
        this.pageNum = pageNum;
    }

    public int getCount() {
        return count;
    }

    public int getRows() {
        return rows;
    }

    public int getPageNum() {
        return pageNum;
    }

    /**
     * 获得翻页数据数组包括：
     * 分页数
     * mysql limit偏移量
     * @return int[]
     */
    public int[] getPageArray(){
        if(count == 0){
            return null;
        }
        int totalPage = PageUtil.totalPage(count,rows);//根据记录总数获得分页总数
        int offset = (pageNum-1)*rows;//获得当前偏移量。

        return new int[]{totalPage,offset};

    }
}
