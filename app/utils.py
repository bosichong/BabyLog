# -*- coding:utf-8 -*-

import time
import datetime
import os


def caltime(date1, date2):
    '''
    返回两个日期之间的间隔天数
    :param date1:
    :param date2:
    :return:
    '''
    # %Y-%m-%d为日期格式，其中的-可以用其他代替或者不写，但是要统一，同理后面的时分秒也一样；可以只计算日期，不计算时间。
    # date1=time.strptime(date1,"%Y-%m-%d %H:%M:%S")
    # date2=time.strptime(date2,"%Y-%m-%d %H:%M:%S")
    date1 = time.strptime(date1, "%Y-%m-%d")
    date2 = time.strptime(date2, "%Y-%m-%d")
    # 根据上面需要计算日期还是日期时间，来确定需要几个数组段。下标0表示年，小标1表示月，依次类推...
    # date1=datetime.datetime(date1[0],date1[1],date1[2],date1[3],date1[4],date1[5])
    # date2=datetime.datetime(date2[0],date2[1],date2[2],date2[3],date2[4],date2[5])
    date1 = datetime.datetime(date1[0], date1[1], date1[2])
    date2 = datetime.datetime(date2[0], date2[1], date2[2])
    # 返回两个变量相差的值，就是相差天数
    # print((date2-date1).days)#将天数转成int型
    return(date2-date1).days


def rtday(day):
    '''
    给出一个日期，计算经历了多上天
    :param day: datetime
    :return: srt
    '''
    baby = selectBaby()

    print(str(day))
    dl = str(day).split()

    time1 = str(baby['brithday'])
    time2 = dl[0]
    return caltime(time1, time2)


def retYearMonth():
    y = datetime.datetime.now().strftime("%Y")  # 现在的年份
    m = datetime.datetime.now().strftime("%m")  # 现在的月份

    return "{}-{}".format(y,m)


def createDir(path):
    '''
    若目录不存在则，创建一个目录
    :param path: 路径地址 请传入目录的绝对地址

    path = os.path.dirname(os.path.abspath(__file__))
    IMAGES_PATH = os.path.join(path,"chinaztu")

    '''
    if not os.path.exists(path):
        os.makedirs(path)