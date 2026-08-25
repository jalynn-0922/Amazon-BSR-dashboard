# Dashboard runtime schema

正式数据文件为 `data/dashboard-data.json`：

```json
{
  "schemaVersion": 1,
  "generatedAt": "ISO-8601",
  "platforms": {
    "amazon": {
      "weeks": [
        {
          "key": "YYYY-MM-DD",
          "label": "YYYY.MM.DD — MM.DD",
          "previous": "YYYY-MM-DD",
          "highlights": [["总体", "..."]],
          "snapshot": {
            "meta": {},
            "groups": [],
            "categories": [],
            "movements": [],
            "ownProducts": []
          }
        }
      ]
    }
  }
}
```

`weeks` 必须按日期倒序。前端只要存在正式 Amazon 周次就不再混用内置 Amazon Demo 周次；淘天在正式采集链路接入前继续使用内置演示数据。
