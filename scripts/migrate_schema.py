#!/usr/bin/env python3
"""
兼容旧命令的 BabyLog 3.1 数据库升级入口。

实际升级逻辑在 upgrade_to_3_1.py：
  - 旧字段名 -> 3.1 字段名
  - healthy -> health_record
  - photo.file_path -> storage_path
  - 创建 video 表及索引
  - 校验行数、内容摘要、外键

推荐直接使用：
  python3 scripts/upgrade_to_3_1.py
  python3 scripts/upgrade_to_3_1.py --apply
"""
import sys

from upgrade_to_3_1 import main


if __name__ == "__main__":
    sys.exit(main())
